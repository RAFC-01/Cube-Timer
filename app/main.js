// 0.1 alpha - first version and start of the app

const version = '0.1 alpha';

document.title += ' - version ' + version;

let currentTime = 0;
let currentAo5 = 0;
let currentAo12 = 0;

const pressedKeys = {};

const options = {
    timerMode: 'space',
    timerFps: 25,
    currentPuzzle: '2x2'
}

let currentTimes = [];
let timesData = [];

const elements = {
    timer: document.getElementById('timer'),
    time: document.getElementById('timer_time'),
    overlay: document.getElementById('overlay'),
    timer_hidable: document.getElementById('timer_hidable'),
    timer_info: document.getElementById('timer_info'),
    times_content: document.getElementById('times_content'),
    timer_ao5_number: document.getElementById('timer_ao5_number'),
    timer_ao12_number: document.getElementById('timer_ao12_number'),
    mean_number: document.getElementById('mean_number'),
    session_times: document.getElementById('session_times'),
    timer_left: document.getElementById('timer-left'),
    scramble_string: document.getElementById('scramble-string'),
    popup_box: document.getElementById('popup_box'),
    popup: document.getElementById('popup'),
    session_single: document.querySelector('#records_single > div:nth-child(2)'),
    allTime_single: document.querySelector('#records_single > div:nth-child(3)'),
    session_ao5: document.querySelector('#records_ao5 > div:nth-child(2)'),
    allTime_ao5: document.querySelector('#records_ao5 > div:nth-child(3)'),
    session_ao12: document.querySelector('#records_ao12 > div:nth-child(2)'),
    allTime_ao12: document.querySelector('#records_ao12 > div:nth-child(3)'),

}

let allTimeBest = {
    single: 0,
    ao5: 0,
    ao12: 0
}

const actions = {
    timeSinceStarted: Date.now(),
    timerStarted: false,
    lastUpdateTime: 0,
    lastGeneratedScramble: '',
    thisSessionScrambles: {},
    sessionBest: {
        single: 0,
        ao5: 0,
        ao12: 0
    }
}

function mainLoop(){
    requestAnimationFrame(mainLoop);
    if (options.timerMode == 'space'){
        if (actions.timerStarted){
            let now = Date.now();
            let time = now - actions.timeSinceStarted;    
            
            currentTime = time;

            if (now - actions.lastUpdateTime > 1000 / options.timerFps){ // limit html updates
                elements.time.innerText = convertMilisToTime(time);
                actions.lastUpdateTime = now;
            }

        }else{
            let pressedTime = getTimeSincePressed();
            if (actions.justStopped) pressedTime = -1;
            if (pressedTime < 500 && pressedTime > -1){
                elements.time.style.color = 'red';
            }else if (pressedTime > 500){
                if (elements.time.style.color != 'var(--ready-color)'){
                    elements.time.style.color = 'var(--ready-color)';
                    timerDivRunningStyles();
                }
            }else{
                elements.time.style.color = 'var(--font-color)';
            }
        }
    }
}

function loadPopUp(data){
    elements.popup_box.style.display = 'flex';
    actions.popupOpened = true;

    let date = new Date(data.solveDate);

    let hour = date.getHours();
    let minutes = date.getMinutes();

    if (hour < 10) hour = "0" + hour;
    if (minutes < 10) minutes = "0" + minutes;

    let day = date.getDate();
    let month = date.getMonth() + 1; 
    let year = date.getFullYear();

    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;

    let formatedDate = hour + ':' + minutes + " - " + day + "/" + month + "/" + year; 
    let content = '';
    if (data.type == 'single'){
        content = `
            <div id='popup_date'>Solve date: ${formatedDate}</div>
            <div id='popup_close_btn' class='close'></div>
            <div id='popup_content'>
                <div id='popup_time'>${convertMilisToTime(data.time)}</div>
                <div id='popup_scramble'>${data.scramble}</div>
            </div>
            <div id='popup_buttons'>
                <div id='popup_remove_btn' class='popup_btn remove_btn'>Remove</div>
                <div id='popup_ok_btn' class='popup_btn ok_btn'>OK</div>
            </div>
        `;
    }
    elements.popup.innerHTML = content;

}
function closePopUp(){
    actions.popupOpened = false;
    elements.popup_box.style.display = 'none';
}

function getNewScramble(puzzle = options.currentPuzzle){
    let scramble = generateScramble(puzzle);

    actions.lastGeneratedScramble = scramble;

    elements.scramble_string.innerText = scramble;

}

function generateScramble(puzzle, length = 9){
    let scramble = '';
    
    let max = 100;
    let tryNum = 0;
    while (actions.thisSessionScrambles[scramble] || scramble == '') {
        if (puzzle == '2x2') scramble = generate2x2Scramble(['F', "F'", "R", "R'", "U", "U'", "F2", "U2", "R2"], length);         
        tryNum++;
        if (tryNum > max) break;
    }

    actions.thisSessionScrambles[scramble] = 1;
    
    scramble = scramble.substring(0, scramble.length-1); // remove last space

    return scramble;
}

function generate2x2Scramble(moves, length){
    let lastMove = null;
    let scramble = '';
    for (let i = 0; i < length; i++){
        let filteredMoves = filterMoves(moves, lastMove);
        let move = getRandomMove(filteredMoves);
        lastMove = move;
        scramble+=move+' ';
    }
    return scramble;
}

function scrambleTest(){
    let generated = {};
    let repeats = 0;
    for (let i = 0; i < 1000; i++){
        let scramble = generateScramble('2x2', 9);
        if (generated[scramble]) repeats++;
        generated[scramble] = 1;
    }
    console.log(generated)
    console.log('repeats '+repeats);
}

function filterMoves(moves = [], lastMove){
    if (!lastMove) return moves;
    if (lastMove == 'R' || lastMove == "R'" || lastMove == 'R2') return removeMoveFromMoves(moves, 'R'); 
    if (lastMove == 'F' || lastMove == "F'" || lastMove == 'F2') return removeMoveFromMoves(moves, 'F'); 
    if (lastMove == 'U' || lastMove == "U'" || lastMove == 'U2') return removeMoveFromMoves(moves, 'U'); 
}

function removeMoveFromMoves(moves, move){
    let newarr = [];
    for (let i = 0; i < moves.length; i++){
        if (moves[i].includes(move)) continue;
        newarr.push(moves[i]);
    }
    return newarr;
}

function getRandomMove(moves){
    let index = Math.floor(Math.random() * moves.length);
    return moves[index];
}

function getTimeSincePressed(){
    if (actions.spacePressTime){
        let timePressed = Date.now() - actions.spacePressTime;
        return timePressed; 
    }
    return -1;
}

function timerAction(){
    let time = getTimeSincePressed();
    if (time > 500){
        startTimer();
    }
}

function startTimer(){
    if (actions.justStopped) return;
    if (actions.timerStarted){
        stopTimer();
        return;
    }

    if (actions.popupOpened) closePopUp();

    actions.timeSinceStarted = Date.now();
    elements.time.style.color = 'white';
    timerDivRunningStyles();
    actions.timerStarted = true;
}
function stopTimer(){
    if (!actions.timerStarted) return;
    actions.timerStarted = false;
    actions.justStopped = true;
    timerDivResetStyles();
    // save time
    currentTimes.push(currentTime);
    
    let timeData = {
        time: currentTime,
        scramble: actions.lastGeneratedScramble,
        solveDate: Date.now()
    }

    updateBestSingle(timeData);

    timesData.push(timeData);

    calculateAo();
    calculateMean();
    
    elements.time.innerText = convertMilisToTime(currentTime);
    addTimesDiv(currentTime);

    getNewScramble()
}

function updateBestSingle(data){
    let time = data.time;
    if (time < actions.sessionBest.single.time || actions.sessionBest.single == 0){
        actions.sessionBest.single = data;
        elements.session_single.innerText = convertMilisToTime(time);
    }
    if (time < allTimeBest.single.time || allTimeBest.single == 0){
        allTimeBest.single = data;
        elements.allTime_single.innerText = convertMilisToTime(time);

    } 

}
function updateBestAo5(data){
    let time = data.time;
    if (time < actions.sessionBest.ao5.time || actions.sessionBest.ao5 == 0){
        actions.sessionBest.ao5 = data;
        elements.session_ao5.innerText = convertMilisToTime(time);
    }
    if (time < allTimeBest.ao5.time || allTimeBest.ao5 == 0){
        allTimeBest.ao5 = data;
        elements.allTime_ao5.innerText = convertMilisToTime(time);
    }     
}

function updateBestAo12(data){
    let time = data.time;
    if (time < actions.sessionBest.ao12.time || actions.sessionBest.ao12 == 0){
        actions.sessionBest.ao12 = data;
        elements.session_ao12.innerText = convertMilisToTime(time);
    }
    if (time < allTimeBest.ao12.time || allTimeBest.ao12 == 0){
        allTimeBest.ao12 = data;
        elements.allTime_ao12.innerText = convertMilisToTime(time);
    }         
} 


function getAverage(arr){
    let sum = 0;
    for (let i = 0; i < arr.length; i++){
        sum += arr[i];
    }
    return Math.floor(sum / arr.length);
}

function getAo(number){
    let biggest = 0;
    let smallest = Infinity;

    let times = [];
    let scrambles = [];

    for (let i = 0; i < number; i++){
        let time = currentTimes[currentTimes.length - 1 - i];
        let scramble = timesData[currentTimes.length - 1 - i].scramble;
        if (biggest < time) biggest = time;
        if (smallest > time) smallest = time;
        times.push(time);
        scrambles.push(scramble)
    }

    let allTimes = times;

    times.splice(times.indexOf(smallest), 1);
    times.splice(times.indexOf(biggest), 1);

    return {time: getAverage(times), times: allTimes, scrambles: scrambles};
}

function calculateMean(){
    // of all solves
    let mean = getAverage(currentTimes);
    if (mean != 0){
        elements.mean_number.innerText = convertMilisToTime(mean, true); 
    }else{
        elements.mean_number.innerText = '-';
    }

}
function calculateAo(){
    if (currentTimes.length > 4){
        let timeData = getAo(5) 
        currentAo5 = timeData.time;
        updateBestAo5(timeData);
        elements.timer_ao5_number.innerText = convertMilisToTime(currentAo5);
        elements.timer_ao5_number.classList.add('hover_highlight');
    }
    if (currentTimes.length > 11){
        let timeData = getAo(12); 
        currentAo12 = timeData.time;
        updateBestAo12(timeData);
        elements.timer_ao12_number.innerText = convertMilisToTime(currentAo12);
        elements.timer_ao12_number.classList.add('hover_highlight');
    }
}

function simulateTimerStop(){
    currentTime = 50;
    actions.timerStarted = true;
    stopTimer();

    let data = timesData[0];
    data.type = 'single';

    loadPopUp(data);
}

function addTimesDiv(time){
    elements.times_content.innerHTML = getTimeLabelDiv({time: time}) + elements.times_content.innerHTML;
}

function getTimeLabelDiv(data){
    let solveTime = convertMilisToTime(data.time);
    let ao5 = currentAo5 > 0 ? convertMilisToTime(currentAo5) : '-';
    let ao12 = currentAo12 > 0 ? convertMilisToTime(currentAo12) : '-';

    if (solveTime.length > 6) document.documentElement.style.setProperty('--left-size-min-width', '300px');

    let number = data.number ? data.number : currentTimes.length;

    return `
    <div class='times_timelabel' data-index='${number-1}'>
        <div class='times_solveNum time_row'>${number}</div>
        <div class='times_time time_row hover_highlight'>${solveTime}</div>
        <div class='times_ao5 time_row ${ao5 != '-' ? 'hover_highlight' : ''}'>${ao5}</div>
        <div class='times_ao12 time_row ${ao12 != '-' ? 'hover_highlight' : ''}'>${ao12}</div>
    </div>`
}

function loadTimesDiv(){
    let content = '';
    for (let i = 0; i < currentTimes.length; i++){
        content += getTimeLabelDiv({time: currentTimes[i], number: i+1});
    }
    elements.times_content.innerHTML = content;
}

function timerDivRunningStyles(){
    elements.time.style.fontSize = '10vw';
    elements.overlay.style.display = 'none';
    elements.timer_hidable.style.display = 'none';
    elements.timer_info.style.display = 'none';
    elements.timer_left.style.display = 'none';

}
function timerDivResetStyles(){
    elements.time.style.fontSize = '6vw';
    elements.timer_hidable.style.display = 'block';
    elements.timer_info.style.display = 'block';
    elements.overlay.style.display = 'block';
    elements.timer_left.style.display = 'block';
}

function convertMilisToTime(milis, getLong = false){
    // milis += 3300000;
    let minutes, secs, ms;
    let long = '';
    
    minutes = Math.floor(milis / 1000 / 60);
    secs = Math.floor(milis / 1000 ) % 60;
    ms = milis % 1000;
    ms = ms < 100 && ms > 10 ? '0'+ms : ms;
    ms = ms < 10 ? '00'+ms : ms;

    if (minutes > 0 && secs < 10) secs = '0' + secs;

    long = minutes + ':' + secs + '.'+ms;

    if (minutes > 0) ms = ms.toString().substring(0, 3 -  minutes.toString().length);

    let time = minutes + ':' + secs + '.'+ms;

    if (!ms) time = minutes + ':' + secs;

    if (minutes == 0) {
        time = secs+'.'+ms
        long = time;
    };

    return getLong ? long : time;
}

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    pressedKeys[key] = 1;

    if (key == ' '){
        if (!actions.spacePressTime) actions.spacePressTime = Date.now();
        stopTimer();
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();

    if (key == ' '){
        timerAction();
        actions.spacePressTime = null;
        actions.justStopped = false;
    }

    delete pressedKeys[key];
});

document.addEventListener('mousedown', (e) => {
    let t = e.target;
    if (actions.popupOpened && !t.id.includes('popup')){
        closePopUp();
    }
    if (t.id == 'popup_close_btn' || t.id == 'popup_ok_btn'){
        closePopUp();
    }
    if (t.classList.contains('times_time')){
        let index = t.parentElement.dataset.index;
        let data = timesData[index];

        data.type = 'single';

        loadPopUp(data);
    }
});

getNewScramble(options.currentPuzzle);
// simulateTimerStop();
mainLoop();