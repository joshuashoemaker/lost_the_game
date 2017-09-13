//----------Constant Values and Objects---------
let targetIpAddress = ''; // left empty, is assigned later.
const lockoutMax = 12; //How many chances the user gets
let lockoutHits = 0; 
const amountOfIps = 20; //amount of entries to chohose from
let ipAttempts = [];
let time = 460000; //Games time limit
let lose = false;
let win = false;
let timerElement = document.getElementById('timer'); //The HTML element that renders the time left
let timeInterval = {}; //Empty object that will be turned into a timeInterval that will control the game timer.
let score = 0;
let winScore = 3; //How many rounds the game has

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



//---------------------Helper Functions---------------------
/*These are pure functions. They do not change the state of the 
application so I keep these seperated from teh business logic 
funcitons that alter the view and take in input*/

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


/*This function is used several time to get random numbers that are used
to get the random Longitude and Lattiudes, to select one of the IP addresses
as the target, etc.*/
function randomInRange(min, max, fixed){
  return (Math.random() * (max - min) + min).toFixed(fixed) * 1;
}


/*This function is used to return a randon alphanumeric sting that is added to
a new Entry() object to give its 'systemName' a unique value.*/
function createRandomName(){
  let text = "";
  let possible = "0123456789QWERTYUIOP_-ASDFGHJKLZXCVBNM";
  
  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  
  return text;
}


/*This takes in the entry object that was instantiated by 'new Entry()'
We return the HTML element in the form of a string. This will later be
put into the Array htmlArray that is declared later on above the 'Business
Logic Section'*/
function createEntryHTML(entry){

  //ES6 object destructuring 
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

/*This returns the array of HTML Element strings. This array is later 
iterated through in a function to concatinate the strings together in
'concatEntryHTMLArray().' That concatenated value is then used to render
the entries  */
function createEntryHTMLArray(entries){

  let htmlStrings = [];

  entries.forEach(function(e) {
    htmlStrings.push(createEntryHTML(e));
  }, this);

  return htmlStrings;
}



/*This funciton creates an array of Entry objects that will later be iterated
though to render to the view.  */
function createEntryArray(){
  
  let entries = [];

  for(i = 0; i < amountOfIps; i++){
    entries.push(new Entry());
  }

  return entries;
}


/*This function iterates thou the array of HTML Entry Element strings to turn them
into one big string that will be used to render to the view. */
function concatEntryHTMLArray(entries){

  let htmlString = "";

  entries.forEach(function(e) {
    htmlString += e;
  }, this);

  return htmlString;
}

/*This function is used to extract and return the data-ip-address value from the literal
html element that is passed into it. We need to extract this data when we click on the
entries in the view. to perform certain tasks.*/
function extractIpAddressFromElement(element){
  ipAddress = element.getAttribute('data-ip-value');
  return ipAddress;
}


/*This function finds a value among the entires that have already been genrated and returns
that value. That value will later be assigned to a global aiable */
function selectTargetIpAddress(entries){
  let value = entries[randomInRange(0, entries.length - 1, 0)].value;
  return value;
}


/*This function finds the similarity between the selected entriy and the target entry 
and returns a number that tells how similar they were. It uses the Levenstien method 
that is provided in a different file. */
function compareIpAddress(value){
  let levDis = new Levenshtein(value, targetIpAddress);
  let similarCount = 10 - levDis.distance;
  return similarCount;
}



//--------------------Business Logic------------------

//Begins the game/round... Obvi
function beginRound(){
  document.getElementById('entry_table').innerHTML = "";
  ipAttempts = [];
  let entryArray = createEntryArray();
  let htmlArray = createEntryHTMLArray(entryArray);
  let entryHTMLString = concatEntryHTMLArray(htmlArray);
  let entryElements = document.getElementsByClassName('entry');

  targetIpAddress = selectTargetIpAddress(entryArray);
  renderEntries(entryHTMLString);
  assignClickEvent(entryElements);
  renderSuccessPrecentage(score * 100/winScore);
  renderAttempts();

  console.log(targetIpAddress);

}

function beginClicked(){
  let messege = document.getElementById('messege');
  messege.innerHTML = ""
  messege.className = "hidden";
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
      renderSuccessPrecentage(score * 100/winScore);
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


function renderEntries(htmlString){
  document.getElementById('entry_table').innerHTML = htmlString;
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


function renderEndGame(){
  document.getElementById('entry_table').innerHTML = "";
  let messege = document.getElementById('messege');

  messege.innerHTML = "<p>You have found her! It was not easy, but your diligence paid off. The data you have collected has been sent to the F.B.I. Please help actually fight human trafficking by donating to one of several private organizations or report tips to goverment agencies that do just that!</p><button onclick='redirectToFoundation()'>HELP</button>"
  messege.className = "";
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

  
  setTimeout(function(){
    window.location.reload(true)
  }, 4000); 
}

function gameWin(){
  let targetElement = document.querySelector('[data-ip-value="' + targetIpAddress + '"]')

  win = true;
  targetElement.className = "win";
  clearInterval(timeInterval);
  timerElement.innerHTML = 0;

  renderEndGame();

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

function redirectToFoundation(){
  window.open('https://www.dhs.gov/blue-campaign/identify-victim?utm_source=bing&utm_medium=cpc&utm_campaign=search-p1.broad-allcit-allpri&utm_content=trafficking&utm_term=%2Btrafficking', '_blank')
}
