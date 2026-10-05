/* Bounded, read-only ZIP project extraction. No filesystem paths are created.
 * Store and raw-DEFLATE supported; ZIP64, encryption and spanning rejected.
 * CRC-32 and actual decompressed size verified before JSON parsing.
 */
(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.CaseArchive=a;})(globalThis,function(){'use strict';
 const MAX_ZIP=16777216,MAX_JSON=8388608,MAX_TOTAL_JSON=16777216,MAX_ENTRIES=512;
 const CRC_TABLE=Array.from({length:256},(_,i)=>{let n=i;for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
 async function extract(bytes){if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);if(bytes.length>MAX_ZIP)throw Error('ZIP exceeds the 16 MiB limit.');const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),need=(p,n)=>{if(p<0||p+n>bytes.length)throw Error('Truncated ZIP structure.');},u16=p=>{need(p,2);return dv.getUint16(p,true)},u32=p=>{need(p,4);return dv.getUint32(p,true)};
  let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(u32(i)===0x06054b50&&i+22+u16(i+20)===bytes.length){end=i;break;}if(end<0)throw Error('ZIP end directory not found.');
  if(u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10))throw Error('Spanned ZIP archives are not supported.');const count=u16(end+10),cdsize=u32(end+12),start=u32(end+16);if(count===65535||start===0xffffffff||cdsize===0xffffffff)throw Error('ZIP64 is not supported.');if(count>MAX_ENTRIES)throw Error('ZIP contains more than 512 entries.');need(start,cdsize);if(start+cdsize>end)throw Error('Invalid ZIP directory bounds.');
  const entries=[],names=new Set;let pos=start,total=0;
  for(let i=0;i<count;i++){
    need(pos,46);if(u32(pos)!==0x02014b50)throw Error('Invalid ZIP central directory.');const flags=u16(pos+8),method=u16(pos+10),crc=u32(pos+16),compressed=u32(pos+20),size=u32(pos+24),nl=u16(pos+28),el=u16(pos+30),cl=u16(pos+32),offset=u32(pos+42);need(pos+46,nl+el+cl);const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(pos+46,pos+46+nl));pos+=46+nl+el+cl;
    if(name.startsWith('/')||name.includes('\\')||name.split('/').includes('..')||name.includes('\0')||/^[a-z]:/i.test(name))throw Error('Unsafe ZIP entry path.');
    if(names.has(name))throw Error('Duplicate ZIP entry name.');names.add(name);if(size===0xffffffff||compressed===0xffffffff||offset===0xffffffff)throw Error('ZIP64 entry is not supported.');
    if(!/\.json$/i.test(name)||name.startsWith('__MACOSX/'))continue;
    if(flags&1)throw Error('Encrypted ZIP JSON entries are not supported.');if(![0,8].includes(method))throw Error('Unsupported ZIP compression. Extract the native JSON and open it directly.');if(size>MAX_JSON||(total+=size)>MAX_TOTAL_JSON)throw Error('ZIP JSON expands beyond the safe import limit.');
    need(offset,30);if(u32(offset)!==0x04034b50||u16(offset+8)!==method||u16(offset+6)!==flags)throw Error('ZIP local header does not match its directory.');const lnl=u16(offset+26),lel=u16(offset+28),begin=offset+30+lnl+lel;need(offset+30,lnl+lel);const localName=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(offset+30,offset+30+lnl));if(localName!==name)throw Error('ZIP filename mismatch.');need(begin,compressed);if(begin+compressed>start)throw Error('ZIP entry overlaps the central directory.');entries.push({name,method,crc,size,compressed,start:begin});
  }
  if(pos!==start+cdsize)throw Error('Unexpected ZIP directory size.');const out=[];let actualTotal=0;
  for(const e of entries){let raw=bytes.subarray(e.start,e.start+e.compressed),result;
    if(e.method===0){if(raw.length!==e.size)throw Error('Stored ZIP entry size mismatch.');result=raw;}
    else{if(typeof DecompressionStream==='undefined')throw Error('This browser cannot decompress ZIP files. Extract the native JSON and open it directly.');let ds;try{ds=new DecompressionStream('deflate-raw');}catch(_){throw Error('Raw-DEFLATE ZIP support is unavailable. Extract and open the native JSON instead.');}const reader=new Blob([raw]).stream().pipeThrough(ds).getReader(),chunks=[];let n=0;try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>MAX_JSON||n>e.size){await reader.cancel();throw Error('ZIP decompression exceeded its declared size.');}chunks.push(r.value);}}finally{reader.releaseLock();}result=new Uint8Array(n);let p=0;for(const c of chunks){result.set(c,p);p+=c.length;}}
    actualTotal+=result.length;if(actualTotal>MAX_TOTAL_JSON||result.length!==e.size)throw Error('ZIP decompressed size mismatch.');if(crc32(result)!==e.crc)throw Error('ZIP checksum failed for '+e.name);out.push({name:e.name,text:new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(result)});
  }
  if(!out.length)throw Error('No JSON files found. Use Copperbench Save JSON or a project ZIP, not a Gerber-only ZIP.');return out;
 }
 return{extract,crc32,limits:{MAX_ZIP,MAX_JSON,MAX_TOTAL_JSON,MAX_ENTRIES}};
});
