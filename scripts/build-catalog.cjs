/* Rebuild the pinned KiCad 9.0.0 curated catalog. GPL-3.0-only. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),C=require('../library-engine.js');
const root=path.resolve(__dirname,'..'),up=path.join(root,'libraries/upstream'),src=process.argv[2]?path.resolve(process.argv[2]):up,fpRoot=process.argv[2]?path.join(src,'kicad-footprints-9.0.0'):path.join(up,'footprints'),symRoot=process.argv[2]?src:path.join(up,'symbols');
const symbols=new Map(),footprints=new Map(),devices=[],failed=[],manifest=[];
const files=fs.readdirSync(symRoot).filter(n=>n.endsWith('.kicad_sym')),all=Object.fromEntries(files.map(n=>[n.replace('.kicad_sym',''),C.importSymbols(fs.readFileSync(path.join(symRoot,n),'utf8'),n.replace('.kicad_sym','')).symbols]));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function fp(name){if(footprints.has(name))return footprints.get(name);let [lib,n]=name.split(':'),rel=lib+'.pretty/'+n+'.kicad_mod',file=path.join(fpRoot,rel);let bytes=fs.readFileSync(file),r=C.importFootprint(bytes.toString(),lib),f=r.footprint;f.source={...f.source,release:'9.0.0',url:'https://gitlab.com/kicad/libraries/kicad-footprints/-/blob/9.0.0/'+rel,sha256:sha(bytes),license:'CC-BY-SA-4.0 with KiCad exception'};let q=C.fresh();q.library.footprints=[f];C.validate(q);footprints.set(name,f);if(process.argv[2]){fs.mkdirSync(path.dirname(path.join(up,'footprints',rel)),{recursive:true});fs.copyFileSync(file,path.join(up,'footprints',rel));}return f;}
function add(lib,name,category,variants,override){try{let s=all[lib]?.find(s=>s.source.name===name);if(!s)throw Error('Missing symbol');variants=variants||[s.footprint];let fps=variants.map(fp),q=C.fresh(),d={id:C.libraryId('device:'+lib+':'+name),name:override||name,prefix:s.prefix,value:s.value,category,description:s.description,keywords:s.keywords,mpn:variants&&s.footprint?name:'',symbol:s,footprint:fps[0]};C.instantiateDevice(q,d);q.library.devices=[d];C.validate(q);symbols.set(s.id,s);devices.push({...d,symbol:undefined,footprint:undefined,symbolId:s.id,footprintIds:fps.map(f=>f.id),source:{release:'9.0.0',symbol:s.name,license:'CC-BY-SA-4.0 with KiCad exception'}});}catch(e){failed.push(lib+':'+name+' — '+e.message);}}
function list(lib,names,category){for(let n of names.split('|'))add(lib,n,category);}
list('Timer','NE555P|TLC555xP|ICM7555xP|CD4541BE|82C54','Timers');
list('Regulator_Linear','LM7805_TO220|LM317_TO-220|LM337_TO220|AMS1117-3.3|MCP1700-3302E_TO|LM2940CT-5.0|AP2112K-3.3|LP2950-3.3_TO92|LD1117S33TR_SOT223','Power');
list('Transistor_BJT','2N3904|2N3906|BC547|BC557|S8050|TIP120|TIP125|BD139','Transistors');
list('Transistor_FET','2N7000|2N7002|BSS138|BS170|AO3400A|AO3401A|IRF540N|IRLZ44N','Transistors');
list('Diode','1N4148|1N4007|1N5819|BAT54|BAV99|SS14|1N5822|1N4733A','Diodes & LEDs');
list('Amplifier_Operational','MCP6001-OT|MCP6002-xP|OPA2134PA|AD8603|TLV2372IP','Analog');
for(let n of ['LM358','LM324','TL072','TL074','NE5532','LM741']){let size=['LM324','TL074'].includes(n)?14:8;add('Amplifier_Operational',n,'Analog',['Package_DIP:DIP-'+size+'_W7.62mm']);}
for(let n of ['LM393','LM339'])add('Comparator',n,'Analog',['Package_DIP:DIP-'+(n==='LM339'?14:8)+'_W7.62mm']);
list('Amplifier_Audio','LM386|LM386N-1','Analog');
for(let n of ['74HC00','74HC02','74HC04','74HC08','74HC14','74HC32','74HC74','74HC86','74HC123','74HC138','74HC151','74HC165','74HC595','74HC245','74HC4060']){let s=all['74xx'].find(s=>s.source.name===n);if(s)add('74xx',n,'Logic',['Package_DIP:DIP-'+s.pins.length+'_W7.62mm']);}
for(let n of ['4011','4013','4017','4020','4040','4046','4051','4060','4066','4093']){let s=all['4xxx'].find(s=>s.source.name===n);if(s)add('4xxx',n,'Logic',['Package_DIP:DIP-'+s.pins.length+'_W7.62mm']);}
list('Interface_UART','MAX232|MAX485E|SN75176BP|MAX3232','Interfaces');
list('Interface_USB','CH340G|CH340C|CH340E|CH330N|CP2102N-Axx-xQFN24','Interfaces');
list('Interface_Expansion','MCP23017_SP|MCP23008-xP|PCF8574P|TCA9548APWR','Interfaces');
list('MCU_Microchip_ATmega','ATmega328P-P|ATmega328P-A|ATmega32U4-A|ATmega2560-16A','Microcontrollers');
list('MCU_Microchip_ATtiny','ATtiny85-20P|ATtiny84A-P|ATtiny1614-SS|ATtiny13A-P','Microcontrollers');
list('MCU_RaspberryPi','RP2040','Microcontrollers');
list('MCU_ST_STM32F1','STM32F103C8Tx','Microcontrollers');
list('MCU_ST_STM32F4','STM32F407ZGTx','Microcontrollers');
list('Sensor_Temperature','DS18B20|LM35-LP|TMP102xxDRL|MCP9808_MSOP','Sensors');
list('Sensor_Pressure','BMP280','Sensors');list('Sensor_Motion','ADXL343|MPU-6050|BNO055|BMI160','Sensors');
list('Memory_EEPROM','24LC256|24LC02B|24AA02E-SN','Memory');list('Memory_Flash','W25Q32JVSS|W25Q64JVSS|AT25SF081-SSHD-X','Memory');
list('RF_Module','ESP-12E|ESP32-WROOM-32|ESP32-C3-DevKitM-1|RFM69HW','Modules');
list('MCU_Module','Arduino_UNO_R3|Arduino_Nano_v3.x','Modules');
list('Isolator','PC817|4N25|6N137','Isolation');list('Driver_Motor','L293D|ULN2003A|ULN2803A','Drivers');
list('Relay','G5LE-1|G5V-1|G5V-2|SRD-05VDC-SL-C','Switches & relays');
const rr=['0402_1005Metric','0603_1608Metric','0805_2012Metric','1206_3216Metric','1210_3225Metric','2010_5025Metric','2512_6332Metric'];
add('Device','R','Passives',rr.map(n=>'Resistor_SMD:R_'+n).concat(['Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P7.62mm_Horizontal','Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal']),'Resistor');
add('Device','C','Passives',rr.slice(0,5).map(n=>'Capacitor_SMD:C_'+n).concat(['Capacitor_THT:C_Disc_D5.0mm_W2.5mm_P5.00mm']),'Capacitor');
add('Device','C_Polarized','Passives',['Capacitor_THT:CP_Radial_D5.0mm_P2.00mm','Capacitor_THT:CP_Radial_D6.3mm_P2.50mm','Capacitor_THT:CP_Radial_D8.0mm_P3.50mm','Capacitor_THT:CP_Radial_D10.0mm_P5.00mm'],'Polarized capacitor');
add('Device','L','Passives',['Inductor_SMD:L_0805_2012Metric','Inductor_SMD:L_1206_3216Metric'],'Inductor');
add('Device','LED','Diodes & LEDs',['LED_THT:LED_D3.0mm','LED_THT:LED_D5.0mm','LED_SMD:LED_0603_1608Metric','LED_SMD:LED_0805_2012Metric','LED_SMD:LED_1206_3216Metric'],'LED');
add('Device','Crystal','Passives',['Crystal:Crystal_HC49-4H_Vertical','Crystal:Crystal_HC49-U_Vertical'],'Crystal');
add('Device','R_Potentiometer','Passives',['Potentiometer_THT:Potentiometer_Bourns_3296W_Vertical'],'Trimmer potentiometer');
add('Switch','SW_Push','Switches & relays',['Button_Switch_THT:SW_PUSH_6mm'],'Pushbutton');
add('Connector','TestPoint','Connectors',['TestPoint:TestPoint_Pad_D1.0mm','TestPoint:TestPoint_Pad_D2.0mm','TestPoint:TestPoint_THTPad_D2.0mm_Drill1.0mm'],'Test point');
for(let rows of [1,2])for(let n of [2,3,4,5,6,8,10,12,16,20]){let dim=rows+'x'+String(n).padStart(2,'0'),s=rows===1?'Conn_01x'+String(n).padStart(2,'0'):'Conn_02x'+String(n).padStart(2,'0')+'_Odd_Even';add('Connector_Generic',s,'Connectors',['Connector_PinHeader_2.54mm:PinHeader_'+dim+'_P2.54mm_Vertical','Connector_PinSocket_2.54mm:PinSocket_'+dim+'_P2.54mm_Vertical'],'Header '+dim);}
add('MCU_Module','RaspberryPi_Pico','Modules',['Module:RaspberryPi_Pico_Common_THT']);
add('Timer','NE556','Timers',['Package_DIP:DIP-14_W7.62mm']);
add('Amplifier_Audio','LM386','Analog',['Package_DIP:DIP-8_W7.62mm']);
add('Amplifier_Operational','MCP6002-xP','Analog',['Package_DIP:DIP-8_W7.62mm']);
for(let [name,count] of [['MAX232',16],['MAX3232',16],['MAX485E',8]])add('Interface_UART',name,'Interfaces',['Package_DIP:DIP-'+count+'_W7.62mm']);
add('Memory_EEPROM','24LC256','Memory',['Package_DIP:DIP-8_W7.62mm']);
for(let [sym,pattern] of [['USB_C_Receptacle_USB2.0_16P','USB_C_Receptacle_HRO_TYPE-C-31-M-12'],['USB_B_Micro','USB_Micro-B_Amphenol_10118194-0001LF']])add('Connector',sym,'Connectors',['Connector_USB:'+pattern]);
add('Mechanical','MountingHole','Mechanical',['MountingHole:MountingHole_2.2mm_M2','MountingHole:MountingHole_2.7mm_M2.5','MountingHole:MountingHole_3.2mm_M3','MountingHole:MountingHole_4.3mm_M4']);
// Additional package choices are browsable independently and never auto-mapped by name alone.
const extra=[];for(let n of [6,8,14,16,18,20,24,28,32,40])for(let w of ['7.62','15.24'])extra.push('Package_DIP:DIP-'+n+'_W'+w+'mm');
for(let n of [32,44,48,64,100,144,176,208,256])for(let wh of ['7x7','10x10','14x14','20x20','28x28'])for(let pitch of ['0.5','0.8','1'])extra.push('Package_QFP:LQFP-'+n+'_'+wh+'mm_P'+pitch+'mm');
for(let folder of ['Resistor_SMD','Capacitor_SMD','Package_SO','Package_TO_SOT_SMD','MountingHole']){let names=fs.readdirSync(path.join(fpRoot,folder+'.pretty')).filter(n=>n.endsWith('.kicad_mod')&&!/HandSolder|ThermalVia|EP/.test(n));for(let n of names.slice(0,folder==='Package_SO'?25:folder==='Package_TO_SOT_SMD'?10:14))extra.push(folder+':'+n.replace('.kicad_mod',''));}
for(let n of extra){try{fp(n);}catch(e){}}
// Keep the source definitions, including inherited parents, for reproducible conversion.
for(let lib of new Set([...symbols.values()].map(s=>s.source.file.replace('.kicad_sym','')))){let file=path.join(symRoot,lib+'.kicad_sym'),text=fs.readFileSync(file,'utf8'),tree=C.parseSexpr(text),nodes=tree.filter(n=>Array.isArray(n)&&n[0]==='symbol'),keep=new Set([...symbols.values()].filter(s=>s.source.file===lib+'.kicad_sym').map(s=>s.source.name));let again=true;while(again){again=false;for(let n of nodes.filter(n=>keep.has(n[1]))){let e=n.find(a=>Array.isArray(a)&&a[0]==='extends')?.[1];if(e&&!keep.has(e)){keep.add(e);again=true;}}}const sexpr=x=>Array.isArray(x)?'('+x.map(sexpr).join(' ')+')':typeof x==='number'?String(x):JSON.stringify(x);let subset='(kicad_symbol_lib (version 20241209) (generator circuitbench)\n'+nodes.filter(n=>keep.has(n[1])).map(sexpr).join('\n')+'\n)\n';fs.writeFileSync(path.join(up,'symbols',lib+'.kicad_sym'),subset);for(let s of symbols.values())if(s.source.file===lib+'.kicad_sym')s.source={...s.source,release:'9.0.0',url:'https://gitlab.com/kicad/libraries/kicad-symbols/-/blob/9.0.0/'+lib+'.kicad_sym',sha256:sha(Buffer.from(subset)),license:'CC-BY-SA-4.0 with KiCad exception'};}
const catalog={format:'circuitbench-catalog',schema:1,version:'1.1.0',upstream:'KiCad 9.0.0',license:'CC-BY-SA-4.0 with KiCad exception',symbols:[...symbols.values()],footprints:[...footprints.values()],devices};fs.writeFileSync(path.join(root,'libraries/catalog.json'),JSON.stringify(catalog));fs.writeFileSync(path.join(root,'catalog.js'),'/* KiCad 9.0.0 library data adapted for CIRCUITBENCH. CC-BY-SA-4.0 with KiCad exception. See libraries/LICENSE.txt. */\n(function(r){const data='+JSON.stringify(catalog)+';if(typeof module!=="undefined")module.exports=data;else r.CB.catalog=data;})(globalThis);\n');fs.writeFileSync(path.join(root,'libraries/catalog-build-report.json'),JSON.stringify({devices:devices.length,symbols:symbols.size,footprints:footprints.size,excluded:failed},null,2));console.log(devices.length+' devices, '+symbols.size+' symbols, '+footprints.size+' footprints');console.log(failed.join('\n'));
