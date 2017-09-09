//----------Constant Values and Objects---------
let targetIpAddress = '';
const lockoutMax = 9;
let lockoutHits = 0;
let ipAttempts = [];
let time = 460000;
let lose = false;
let win = false;
let timerElement = document.getElementById('timer');
let timeInterval = {};
let score = 0;
let winScore = 7;

const systemTypes = ["HIDDEN", "KALILINUX", "WINDOWSXP", "WINDOWS2000", 
                    "WINDOWS10", "REDHAT", "ANDROID4.4", "NETHUNTER"];

const Entry = function(){
  return {
    value: createIP(),
    machineType: systemTypes[randomInRange(0, systemTypes.length - 1, 0)],
    status: "ACTIVE",
    hostName: createRandomName(),
    lastResponse: randomInRange(1000, 10000000, 0),
    systemLocation: {
      long: randomInRange(-180, 180, 3),
      lat: randomInRange(-180, 180, 3)
    }
  }
}



//-----------Helper Functions-----------
function createIP() {
  let text = "";
  let possible = "0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


function formatIP(ip){
    let newIP = ip;

    newIP = newIP.slice(0, 2) + '.' + newIP.slice(2);
    newIP = newIP.slice(0, 6) + '.' + newIP.slice(6);
    newIP = newIP.slice(0, 9) + '.' + newIP.slice(9);

    return newIP;
}


function randomInRange(min, max, fixed){
  return (Math.random() * (max - min) + min).toFixed(fixed) * 1;
}


function createEntryHTML(entry){

  let {value, status, machineType, hostName, lastResponse, systemLocation} = entry;
  let ipAddress = formatIP(value);
  let htmlString = "<tbody>\
                      <tr class='entry' data-ip-value='"+ value +"'>\
                          <span style='display: hidden'></span>\
                          <td>"+ formatIP(value) +"</td>\
                          <td>"+ status +"</td>\
                          <td>"+ hostName +"</td>\
                          <td>"+ machineType +"</td>\
                          <td>"+ lastResponse +"MS</td>\
                          <td>"+ systemLocation.long + "_" + systemLocation.lat +"</td>\
                      </tr>\
                    </tbody>"

  return htmlString;

}

function createEntryHTMLArray(entries){

  let htmlStrings = [];

  entries.forEach(function(e) {
    htmlStrings.push(createEntryHTML(e));
  }, this);

  return htmlStrings;
}


function createRandomName(){
  let text = "";
  let possible = "0123456789QWERTYUIOP_-ASDFGHJKLZXCVBNM";
  
  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  
  return text;
}


function createEntryArray(){
  
  let entries = [];

  for(i = 0; i < 27; i++){
    entries.push(new Entry());
  }

  return entries;
}


function concatEntryHTMLArray(entries){

  let htmlString = "";

  entries.forEach(function(e) {
    htmlString += e;
  }, this);

  return htmlString;
}


function renderEntries(htmlString){
  document.getElementById('entry_table').innerHTML = htmlString;
}


function extractIpAddressFromElement(element){
  ipAddress = element.getAttribute('data-ip-value');
  return ipAddress;
}


function selectTargetIpAddress(entries){
  let value = entries[randomInRange(0, entries.length - 1, 0)].value;
  return value;
}


function compareIpAddress(value){
  let levDis = new Levenshtein(value, targetIpAddress);
  let similarCount = 10 - levDis.distance;
  return similarCount;
}



//----------Business Logic--------

function beginRound(){
  document.getElementById('entry_table').innerHTML = "";
  let entryArray = createEntryArray();
  let htmlArray = createEntryHTMLArray(entryArray);
  let entryHTMLString = concatEntryHTMLArray(htmlArray);
  let entryElements = document.getElementsByClassName('entry');

  targetIpAddress = selectTargetIpAddress(entryArray);
  renderEntries(entryHTMLString);
  assignClickEvent(entryElements);
  renderSuccessPrecentage(score * 100/winScore);

  console.log(targetIpAddress);

}

function beginClicked(){
  let instructions = document.getElementById('messege');
  instructions.innerHTML = ""
  instructions.className = "hidden";
  timeInterval = setInterval(countDown, 10);
  beginRound();
}


function assignClickEvent(elements){
  
  for(i = 0; i < elements.length; i++){
    let entry = elements[i];
    entry.onclick = function(){
      clickedEntry(entry);
    }
  }
}


function clickedEntry(entry){

  if(!lose && !win){
    let ipDifference = compareIpAddress(extractIpAddressFromElement(entry));
      
    if(ipDifference === 10){
      targetIpAddressFound(entry);
    }
    else{
      wrongEntrySelected(entry, ipDifference);
      renderLockout();
      renderSuccessPrecentage(ipDifference * 10);
      checkStatus();
    }
  }
}


function targetIpAddressFound(entry){
  score += 1;
  if(score > winScore - 1){
    gameWin();
  }
  else{
    beginRound();
  }
}


function wrongEntrySelected(entry, similarity){
  let value = extractIpAddressFromElement(entry);

  lockoutHits = lockoutHits + 1;
  saveAttempt(value);
  renderAttempts();
  

  console.log(value + " was incorrect. Tries left: " + (lockoutMax - lockoutHits));
  console.log(similarity + " characters were correct. Try Again!")
}

function renderSuccessPrecentage(percentage){
  let successPercentage =  document.getElementById('precentage');
  successPercentage.innerHTML = Math.floor(percentage) + "%";
}


function renderLockout(){
  let lockoutElement = document.getElementById('lockout');

  lockoutElement.innerHTML = '';

  for(i = 0; i < lockoutHits; i++){
    lockoutElement.innerHTML = lockoutElement.innerHTML + "<span class'lockoutMark'> X </span>";
  }
}


function saveAttempt(value){
  ipAttempts.push(value);
}


function renderAttempts(){
  let attemptsTable = document.getElementById('attempts_table');
  attemptsTable.innerHTML = "";

  ipAttempts.forEach(function(e) {
    attemptsTable.innerHTML += "<td>" + formatIP(e) + "</td>\
                                <td>" + compareIpAddress(e) + " similar chars</td>"
  }, this);
}

function checkStatus(){
  if(lockoutHits >= lockoutMax){
    gameLose();
  }
}


function gameLose(){
  let entryElements = document.getElementsByClassName('entry');
  let entryArray = [];
  
  lose = true;

  timerElement.innerHTML = 0;
  clearInterval(timeInterval);
  
  Array.prototype.forEach.call(entryElements, function(e) {
    e.className = "entry error"
  }, this);
}

function gameWin(){
  let targetElement = document.querySelector('[data-ip-value="' + targetIpAddress + '"]')

  win = true;
  targetElement.className = "win";
  clearInterval(timeInterval);
  timerElement.innerHTML = 0;

  console.log("Game Win");
}

function countDown(){
  if(time > 0 && !lose){
    time -= 10;
    timerElement.innerHTML = time;
  }
  else{
    gameLose();
  }
}
