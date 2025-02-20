// 0.1 alpha - first version and start of the app
// 0.2 alpha - saving data (best only for now), timer mode typing
// 0.3 alpha - saving whole sessions, highlighting best times of the session
// 0.4 alpha - deleting times, swiching sessions
// 0.5 alpha - time distribution grapth, creating sessions
const appTitle = 'Cube Timer';

const version = '0.5 alpha';

document.title = appTitle + ' - version ' + version;

let currentTime = 0;
let currentAo5 = 0;
let currentAo12 = 0;

let requriedToStart = [
    {name: 'mainData'}, 
    {name: 'sessionInfo', data: {type: 'bin'} }
    ];
let changedData = [];

let savableData = {
    mainData: {}
}

let loadStatus = {};

let loadProgess = 0;

const pressedKeys = {};

const options = {
    timerFps: 25,
    currentPuzzle: '2x2',
    maxVisibleTimes: 40 
}

let solvesDoneSinceSave = 0;

let timesData = [];

let currentSession = {};

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
    loadScreen: document.getElementById('loadScreen'),
    mean_number_of_solves: document.getElementById('mean_number_of_solves'),
    custom_popup: document.getElementById('custom_popup'), 
    notification: document.getElementById('notification'),
    n_single: document.getElementById('n_single'), 
    n_ao5: document.getElementById('n_ao5'), 
    n_ao12: document.getElementById('n_ao12'), 
    timer_need_ao5: document.getElementById('timer_need_ao5'),
    timer_need_ao12: document.getElementById('timer_need_ao12'),
    info_current_puzzle: document.getElementById('info_current_puzzle'),
    info_other_sessions: document.getElementById('info_other_sessions'),
    window: document.getElementById('window'),
    window_box: document.getElementById('window_box'),
    window_content: document.getElementById('window_content'),
    window_title: document.getElementById('window_title_text'),
    window_buttons: document.getElementById('window_buttons'),
    sessions_title_name: document.getElementById('sessions_title_name'),
    window_small_popup_title: document.getElementById('window_small_popup_title'),
    window_small_popup_content: document.getElementById('window_small_popup_content'),
    window_small_popup_buttons: document.getElementById('window_small_popup_buttons'),
    window_small_popup_box: document.getElementById('window_small_popup_box'),
    wholeScreenCheck: document.getElementById('wholeScreenCheck'),
    time_distribution: document.getElementById('time_distribution'),
    time_distribution_numbers: document.getElementById('time_distribution_numbers'),
    time_distribution_content: document.getElementById('time_distribution_content'),
    bottom_functions: document.getElementById('bottom_functions'),
}   

let allTimeBest = {
    single: 0,
    ao5: 0,
    ao12: 0
}

const actions = {
    appLoaded: false,
    timeSinceStarted: Date.now(),
    timerStarted: false,
    lastUpdateTime: 0,
    lastGeneratedScramble: '',
    thisSessionScrambles: {},
    sessionBest: {
        single: 0,
        ao5: 0,
        ao12: 0
    },
    currentSession: 0,
    notificationIter: 0,
    timeDistributionOpen: true,
}

function mainLoop(){
    requestAnimationFrame(mainLoop);
    if (savableData.mainData.timerMode == 'space'){
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

function loadMakeSureDeleteMessage(){
    if (!timesData.length) return;
    elements.popup_box.style.display = 'flex';
    let content = `
        <div id='popup_close_btn' class='close'></div>
        <div id='popup_content'>
            <div id='popup_question'>Are you sure you what to delete all times from this session?</div>
        </div>
        <div id='popup_buttons'>
            <div id='popup_ok_btn' class='popup_btn ok_btn'>Cancel</div>
            <div id='popup_remove_btn' class='popup_btn remove_btn' data-type='all_times'>Remove</div>
        </div>
    `;
    elements.popup.innerHTML = content;
}
function removeAllSessionTimes(){
    let session = getSessionName();
    console.log(session);
    savableData[session].arr = [];
    timesData = savableData[session].arr; // keep the reference to variable
    currentAo5 = 0;
    currentAo12 = 0;
    actions.sessionBest = {
        single: 0,
        ao5: 0,
        ao12: 0
    }
    actions.thisSessionScrambles = {};
    elements.times_content.innerHTML = '';
    zeroSessionTimeFields();
    markAsChanged(session);
}
function loadPopUp(data){
    elements.popup_box.style.display = 'flex';
    actions.popupOpened = true;

    let date = new Date(data.solveDate);

    let hour = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds(); 

    if (hour < 10) hour = "0" + hour;
    if (minutes < 10) minutes = "0" + minutes;

    let day = date.getDate();
    let month = date.getMonth() + 1; 
    let year = date.getFullYear();

    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;

    let specificTime = hour + ':' + minutes + ':' +seconds;
    let formatedDate = `<span title="${specificTime}">${hour}:${minutes}</span> - ${day}/${month}/${year}`; 
    let content = '';
    if (data.type == 'single'){
        content = `
            <div id='popup_date'>Solve date: ${formatedDate}</div>
            <div id='popup_close_btn' class='close'></div>
            <div id='popup_content'>
                <div id='popup_time'>${convertMilisToTime(data.time, true)}</div>
                <div id='popup_scramble'>${data.scramble}</div>
            </div>
            <div id='popup_buttons'>
                <div id='popup_remove_btn' class='popup_btn remove_btn' data-index='${data.index}'>Remove</div>
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
function openWindow(content, title = 'no title'){
    actions.windowOpened = true;
    elements.wholeScreenCheck.style.display = 'block';
    elements.window_box.style.display = 'flex';
    elements.window_title.innerHTML = title;
    elements.window_content.innerHTML = content.innerHTML;
}
function closeWindow(){
    elements.wholeScreenCheck.style.display = 'none';
    actions.windowOpened = false;
    elements.window_box.style.display = 'none';
    setAllWindowsToFalse();
}
function loadSessionsWindow(){
    if (actions.sessionWindowOpen) return;
    let sessions = savableData.mainData.sessions;
    let contentDiv = document.createElement('div');
    let content = '';
    let thisSession = sessions[currentSession.id];
    for (let i = 0; i < sessions.length; i++){
        let session = sessions[i];

        if (session.mode != thisSession.mode) continue;
        
        let activeDiv = session.id == currentSession.id ? `<div class='session_active_card'>Active</div>` : '';

        let name = session.name.length ? session.name : 'session '+session.id; 
        let mean = convertMilisToTime(session.mean) || ' - ';

        content += `
            <div class='session_card' data-index='${i}'>
                <div style='pointer-events: none'>
                    <div class='session_name_card'>"${name}"</div>
                    <p>Mode: ${session.mode}</p>
                    <p>puzzle: ${session.puzzle}</p>
                    <p>Mean: ${mean}</p>
                    <p>Solves: ${session.solves || 0}</p>
                    ${activeDiv}    
                </div>
            </div>            
        `
    }
    contentDiv.innerHTML = content;
    actions.sessionWindowOpen = true;
    elements.window_buttons.innerHTML = `<div id='sessoion_create_btn' class='info_btn'>Create New Session</div>`
    openWindow(contentDiv, 'Your Sessions');
}
function openWindowSmallPopUp(content, title){
    actions.smallPopOpen = true;
    elements.window_small_popup_box.style.display = 'flex';
    elements.window_small_popup_content.innerHTML = content;
    elements.window_small_popup_title.innerHTML = title;
}
function closeWindowSmallPopUp(){
    actions.smallPopOpen = false;
    actions.createSessionPopUp = false;
    elements.window_small_popup_box.style.display = 'none';
}
function setAllWindowsToFalse(){
    actions.sessionWindowOpen = false;
}
function getNewScramble(puzzle = options.currentPuzzle){
    let scramble = generateScramble(puzzle);

    actions.lastGeneratedScramble = scramble;

    getScrambleImage(scramble);
    console.log(scramble);

    elements.scramble_string.innerText = scramble;

}

function loadCreateSessionPopUp(){
    actions.createSessionPopUp = true;
    let data = savableData.mainData;
    let defaultName = 'session '+data.numberOfAllSessions;
    let content = `
            Name
            <input type='text' value='${defaultName}' placeholder='session name' id='small_window_session_name' class='smallInput'/>
            Puzzle
            <select class='smallInput' id='small_window_session_puzzle'>
                <option value='2x2'>2x2x2</option>
            </select>
    `;
    openWindowSmallPopUp(content, 'create session');
}

function getTimeNeededForNewAvgs(){
    if (timesData.length < 4 || !actions.sessionBest.ao5 && !actions.sessionBest.ao12) return;
    let desiredAo5 = actions.sessionBest.ao5.time || 0;
    let desiredAo12 = actions.sessionBest.ao12.time || 0;
    let sum = {
        4: 0,
        11: 0,
    }
    let hightest = {
        4: 0,
        11: 0,
    }
    let lowest = {
        4: 0,
        11: 0
    }
    let end =  timesData.length > 10 ? timesData.length - 11 : timesData.length - 4; 
    for (let i = timesData.length-1; i >= end; i--){
        let t = timesData[i].time;
        if (i > timesData.length - 5){
            // console.log(i);
            console.log('add');
            sum[4] += t;
            if (t > hightest[4]) hightest[4] = t;
            if (t < lowest[4] || lowest[4] == 0) lowest[4] = t;
        }
        if (timesData.length > 11){
            sum[11] += t;
            if (t > hightest[11]) hightest[11] = t;
            if (t < lowest[11] || lowest[11] == 0) lowest[11] = t;
        }
    }

    let timeAo5 = (desiredAo5-1) * 3 + hightest[4] + lowest[4] - sum[4];
    let timeAo12 = (desiredAo12-1) * 10 + hightest[11] + lowest[11] - sum[11];
    if (timeAo5 < lowest[4] || timeAo5 > hightest[4]) timeAo5 = false;
    if (timeAo12 < lowest[11] || timeAo12 > hightest[11]) timeAo12 = false;

    let requiredTimes = {
        ao5: timeAo5,
        ao12: timeAo12
    }
    return requiredTimes;
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
    if (actions.justStopped || !actions.appLoaded) return;
    if (actions.timerStarted){
        stopTimer();
        return;
    }

    if (actions.popupOpened) closePopUp();
    if (actions.notificationShown) stopNotifination();

    actions.timeSinceStarted = Date.now();
    elements.time.style.color = 'white';
    timerDivRunningStyles();
    actions.timerStarted = true;
}
function stopTimer(){
    if (!actions.timerStarted) return;
    actions.timerStarted = false;
    actions.justStopped = true;
    if (savableData.mainData.timerMode != 'type') elements.time.innerText = convertMilisToTime(currentTime);
    timerDivResetStyles();
    // save time

    solvesDoneSinceSave++;
    let notifySingle = actions.sessionBest.single;
    let notifyAvg5 = actions.sessionBest.ao5;
    let notifyAvg12 = actions.sessionBest.ao12;

    let timeData = {
        time: currentTime,
        scramble: actions.lastGeneratedScramble,
        solveDate: Date.now(),
    }

    if (currentSession){
        let sessionName = getSessionName();
        if (!savableData[sessionName]) savableData[sessionName] = { check: true, arr: []};
        else if (!savableData[sessionName].arr) savableData[sessionName].arr = [];
        savableData[sessionName].arr.push(timeData);
        markAsChanged(sessionName);
    }else{
        timesData.push(timeData);
    }


    let newSingle = updateBestSingle({time: currentTime});
    // new best single signals
    elements.n_single.style.display = 'none';
    elements.n_ao5.style.display = 'none';
    elements.n_ao12.style.display = 'none';

    if (newSingle.session && notifySingle){
        elements.n_single.style.display = 'block';
        elements.notification.style.display = 'block';
        actions.notificationShown = true;
        actions.notificationIter = 0;
        elements.bottom_functions.style.display = 'none';
    }
    if (newSingle.all) console.log('new single all');

    let newAvgs = calculateAo();
    // new avg singnals
    if (newAvgs.ao5.session && notifyAvg5){
        elements.n_ao5.style.display = 'block';
        elements.notification.style.display = 'block';
        actions.notificationShown = true;
        actions.notificationIter = 0;
        elements.bottom_functions.style.display = 'none';
    }
    if (newAvgs.ao5.all) console.log('new all ao5');
    if (newAvgs.ao12.session && notifyAvg12){
        elements.n_ao12.style.display = 'block';
        elements.notification.style.display = 'block';
        actions.notificationShown = true;
        actions.notificationIter = 0;
        elements.bottom_functions.style.display = 'none';
    }
    if (newAvgs.ao12.all) console.log('new all ao12');

    updateNeedTimes();

    calculateMean();
    
    let data = {time: currentTime, newTimes: {
        single: newSingle.session,
        ao5: newAvgs.ao5.session,
        ao12: newAvgs.ao12.session,
    }};

    if (data.newSingle && data.newAo5 && data.newAo12){
        // feature: [A] tripple muffin
    }
    addTimesDiv(data);

    updateTimeDistribution();

    getNewScramble();
}

function addAlotOfTimes(){
    for (let i = 0; i < 1000000; i++){
        let data = {
            time: 51516151,
            scramble: 'R SD FS DFSFS FD',
            solveTime: Date.now()
        }
        addToAllSolves(data, options.currentPuzzle);
    }
}

function addToAllSolves(timeData, currentP){
    if (!savableData.allTimes[currentP]) savableData.allTimes[currentP] = [];
    savableData.allTimes[currentP].push(timeData);
    // saveAllTimes();
}

function saveAllTimes(data = {}){
    if (!solvesDoneSinceSave) return false;
    if (loadStatus['allTimes']){
        window.electron.send('save-data', {
            times: savableData.allTimes,
            type: 'allTimes',
            closing: data.closing,
        }); 
        solvesDoneSinceSave = 0;
        return true;
    }else{
        console.error('data was not loaded so it cannot be saved!');
        return false;
    }
}
function getSessionById(id){
    for (let i = 0; i < savableData.mainData.sessions.length; i++){
        let s = savableData.mainData.sessions[i];
        if (s.id == id) return s;
    }
}
function getCurrentSession(){
    if (!savableData.mainData || !savableData.mainData.sessions) return;
    for (let i = 0; i < savableData.mainData.sessions.length; i++){
        let s = savableData.mainData.sessions[i];
        if (s.id == currentSession.id) return s;
    }
    return false;
}
function updateBestSingle(data){
    let newBest = {'session': false, 'all': false};
    let time = data.time;
    if (time < actions.sessionBest.single.time || actions.sessionBest.single == 0){
        actions.sessionBest.single = data;
        elements.session_single.innerText = convertMilisToTime(time);
        newBest['session'] = true;
    }
    if (time < allTimeBest.single.time || allTimeBest.single == 0){
        allTimeBest.single = data;
        elements.allTime_single.innerText = convertMilisToTime(time);
        newBest['all'] = true;
    } 
    return newBest;
}
function updateBestAo5(data = {}){
    let newBest = {'session': false, 'all': false};
    let time = data.time;
    if (time < actions.sessionBest.ao5.time || actions.sessionBest.ao5 == 0){
        actions.sessionBest.ao5 = data;
        elements.session_ao5.innerText = convertMilisToTime(time);
        newBest['session'] = true;
    }
    if (time < allTimeBest.ao5.time || allTimeBest.ao5 == 0){
        allTimeBest.ao5 = data;
        elements.allTime_ao5.innerText = convertMilisToTime(time);
        newBest['all'] = true;
    }   
    return newBest;  
}

function updateBestAo12(data = {}){
    let newBest = {'session': false, 'all': false};
    let time = data.time;
    if (time < actions.sessionBest.ao12.time || actions.sessionBest.ao12 == 0){
        actions.sessionBest.ao12 = data;
        elements.session_ao12.innerText = convertMilisToTime(time);
        newBest['session'] = true;
    }
    if (time < allTimeBest.ao12.time || allTimeBest.ao12 == 0){
        allTimeBest.ao12 = data;
        elements.allTime_ao12.innerText = convertMilisToTime(time);
        newBest['all'] = true;
    }         
    return newBest;
} 
function updateTimeDistribution(){
    elements.time_distribution.style.display = 'block';
    let times = {};
    let sessionName = getSessionName();
    let biggest = -1;
    // only seconds mode for now
    for (let i = 0; i < savableData[sessionName].arr.length; i++){
        let t = savableData[sessionName].arr[i].time;
        let s = Math.floor(t / 1000);
        times[s] ? times[s] += 1 : times[s] = 1;
        if (biggest == -1 || times[s] > times[biggest]) biggest = s;
    }
    let keys = Object.keys(times);
    if (!keys.length){
        elements.time_distribution.style.display = 'none';
        return;
    }
    let start = parseInt(keys[0]);
    let end = keys.length > 8 ? start+8 : start + parseInt(keys[keys.length-1]);
    let numbersContent = '';
    let content = '';
    if (!times[biggest]) times[biggest] = 1;
    console.log(end);
    for (let i = start; i < end; i++){
        let t = times[i] || 0;
        let height = t / times[biggest] * 100;
        numbersContent += `<div class='time_dist_num'>${i}+</div>`    
        let align = height < 15 ? 'end' : 'center';    
        // let color = height < 15 ? 'var(--font-color)' : 'black';
        content += `<div class='time_dist_column' style='height: ${height}%; align-items: ${align};'><div>${t}</div></div>`;
    }
    elements.time_distribution_numbers.innerHTML = numbersContent;
    elements.time_distribution_content.innerHTML = content;
    console.log(times, biggest, start);

}
function loadData(path, data = {}){
    if (!data.fileLoc) data.fileLoc = 'saves';
    window.electron.send('get-data', {path: path, isSession: data.isSession, fileLoc: data.fileLoc, type: data.type}); 
}

function getAverage(arr){
    let sum = 0;
    for (let i = 0; i < arr.length; i++){
        let t = arr[i].time ? arr[i].time : arr[i];
        sum += t;
    }
    return Math.round(sum / arr.length);
}

function getAo(number, index){
    let biggest = 0;
    let smallest = Infinity;

    let times = [];
    let solves = [];

    let start = index ? index : timesData.length - 1;

    for (let i = 0; i < number; i++){
        let time = timesData[start - i].time;
        let scramble = timesData[start - i].scramble;
        if (biggest < time) biggest = time;
        if (smallest > time) smallest = time;
        times.push(time);
        solves.push([time, scramble])
    }

    times.splice(times.indexOf(smallest), 1);
    times.splice(times.indexOf(biggest), 1);

    return {time: getAverage(times), solves: solves};
}

function zeroSessionTimeFields(){
    elements.mean_number.innerText = '.....';
    elements.mean_number_of_solves.innerText = '';
    elements.session_single.innerText = '-';
    elements.session_ao5.innerText = '-';
    elements.session_ao12.innerText = '-';
    elements.timer_ao5_number.innerText = '-';
    elements.timer_ao12_number.innerText = '-';
    updateNeedTimes();
}   

function calculateMean(){
    // of all solves
    if (!timesData.length) {
        elements.mean_number.innerText = '.....';
        return
    };
    let mean = getAverage(timesData);
    if (mean != 0){
        elements.mean_number.innerText = convertMilisToTime(mean, true); 
    }else{
        elements.mean_number.innerText = '.....';
    }
    let session = getCurrentSession();
    session.mean = mean;
    session.solves = timesData.length;
    elements.mean_number_of_solves.innerText = ' (' + timesData.length + ')';

}
function getAvgAtIndex(index = 0){
    let newAvgs = {
        ao5: {
            session: false,
            all: false,
        },
        ao12: {
            session: false,
            all: false
        }
    }
    let avgs = {};
    if (index >= 4){
        let ao5 = getAo(5, index);
        avgs['ao5'] = ao5.time;   
        let newBest = updateBestAo5(ao5);
        if (newBest.session) newAvgs.ao5.session = true;
        if (newBest.all) newAvgs.ao5.all = true;
    } 
    if (index >= 11){
        let ao12 =  getAo(12, index)
        avgs['ao12'] = ao12.time;
        let newBest = updateBestAo12(ao12);
        if (newBest.session) newAvgs.ao12.session = true;
        if (newBest.all) newAvgs.ao12.all = true;

    } 

    return [avgs, newAvgs];
}
function calculateAo(){
    let newAvgs = {
        ao5: {
            session: false,
            all: false,
        },
        ao12: {
            session: false,
            all: false
        }
    }
    if (timesData.length > 4){
        let timeData = getAo(5) 
        currentAo5 = timeData.time;
        let newBest = updateBestAo5(timeData);
        elements.timer_ao5_number.innerText = convertMilisToTime(currentAo5);
        elements.timer_ao5_number.classList.add('hover_highlight');
        if (newBest.session) newAvgs.ao5.session = true;
        if (newBest.all) newAvgs.ao5.all = true;
    }
    if (timesData.length > 11){
        let timeData = getAo(12); 
        currentAo12 = timeData.time;
        let newBest = updateBestAo12(timeData);
        elements.timer_ao12_number.innerText = convertMilisToTime(currentAo12);
        elements.timer_ao12_number.classList.add('hover_highlight');
        if (newBest.session) newAvgs.ao12.session = true;
        if (newBest.all) newAvgs.ao12.all = true;
    }
    return newAvgs;
}



function simulateTimerStop(time = 50){
    currentTime = time;
    actions.timerStarted = true;
    stopTimer();

    // let data = timesData[0];
    // data.type = 'single';

    // loadPopUp(data);
}

function addTimesDiv(data){
    if (!elements.times_content.childNodes.length || elements.times_content.childNodes[0].dataset.index > timesData.length - 5){
        elements.times_content.insertBefore(getTimeLabelDiv(data), elements.times_content.firstChild);
    }else{
        elements.times_content.scrollTop -= 33;
    }
}

function getTimeLabelDiv(data){
    let solveTime = convertMilisToTime(data.time);
    let ao5 = currentAo5 > 0 ? convertMilisToTime(currentAo5) : '-';
    let ao12 = currentAo12 > 0 ? convertMilisToTime(currentAo12) : '-';

    if (data.avgs){
        ao5 = convertMilisToTime(data.avgs['ao5']);
        ao12 = convertMilisToTime(data.avgs['ao12']);
    } 

    if (solveTime.length > 6) document.documentElement.style.setProperty('--left-size-min-width', '300px');

    let number = data.number ? data.number : timesData.length;
    
    if (!data.newTimes) data.newTimes = {};
    
    // console.trace(data.newTimes);

    let newSingleClass = data.newTimes.single ? 'newRecord_time' : '';
    let newAvg5Class = data.newTimes.ao5 ? 'newRecord_time' : '';
    let newAvg12Class = data.newTimes.ao12 ? 'newRecord_time' : '';
    
    //delete stuff so its not saved
    delete data.avgs; 

    let div = document.createElement('div');
    div.className = 'times_timelabel';
    div.dataset.index = number - 1;
    div.innerHTML = `
        <div class='times_solveNum time_row'>${number}</div>
        <div class='times_time time_row hover_highlight ${newSingleClass}'>${solveTime}</div>
        <div class='${newAvg5Class} times_ao5 time_row ${ao5 != '-' ? 'hover_highlight' : ''}'>${ao5}</div>
        <div class='${newAvg12Class} times_ao12 time_row ${ao12 != '-' ? 'hover_highlight' : ''}'>${ao12}</div>
    `;

    return div;

}
function addLabelBefore(index){
    let data = timesData[index];
    data.number = index+1;
    data.avgs = getAvgAtIndex(index)[0];
    let label = getTimeLabelDiv(data);

    elements.times_content.insertBefore(label, elements.times_content.firstChild);    
}
function addLabelAfter(index){
    let data = timesData[index-1];
    data.number = index;
    data.avgs = getAvgAtIndex(index-1)[0];
    let label = getTimeLabelDiv(data);

    elements.times_content.appendChild(label);
}

function loadTimesDiv(){
    let content = '';
    let end = timesData.length > options.maxVisibleTimes ? timesData.length - options.maxVisibleTimes : 0;
    for (let i = timesData.length-1; i >= end; i--){
        let data = timesData[i];
        data.number = i + 1;
        data.avgs = getAvgAtIndex(i)[0];
        content += `<div class='times_timelabel' data-index='${i}'>${getTimeLabelDiv(data).innerHTML}</div>`;
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
    elements.overlay.style.display = 'flex';
    elements.timer_left.style.display = 'block';
}

function convertMilisToTime(milis, getLong = false){
    // milis += 3300000;
    if (!milis) return '-';
    let minutes, secs, ms;
    let long = '';
    
    minutes = Math.floor(milis / 1000 / 60);
    secs = Math.floor(milis / 1000 ) % 60;
    ms = milis % 1000;
    ms = ms < 100 && ms >= 10 ? '0'+ms : ms;
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

    if (key == ' ' && savableData.mainData && savableData.mainData.timerMode == 'space'){
        if (!actions.spacePressTime) actions.spacePressTime = Date.now();
        stopTimer();
    }
    if (key == 'd') removeTime(0);
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

function stopNotifination(){
    actions.notificationShown = false;
    actions.notificationIter = 0;
    elements.n_single.style.display = 'none';
    elements.n_ao5.style.display = 'none';
    elements.n_ao12.style.display = 'none';
    elements.notification.style.display = 'none';
}
document.querySelector('#notification > div').addEventListener('animationiteration' , ()=> {
    elements.bottom_functions.style.display = 'none';
    actions.notificationIter++;
    if (actions.notificationShown && actions.notificationIter > 2){
        stopNotifination();
        elements.bottom_functions.style.display = 'flex';
    } 
})
document.addEventListener('mousedown', (e) => {
    let t = e.target;
    if (actions.popupOpened && !t.id.includes('popup')){
        closePopUp();
    }
    if ((t.id == 'window_box' || t.id == 'wholeScreenCheck') && actions.windowOpened && !actions.smallPopOpen){
        closeWindow();
    }
    if ((t.id == 'window_small_popup_box' || t.id == 'wholeScreenCheck' || t.id == 'window_box') && actions.smallPopOpen){
        closeWindowSmallPopUp();
    }
    if (t.id == 'window_small_cancel_btn'){
        closeWindowSmallPopUp();
    }
    if (t.id == 'popup_close_btn' || t.id == 'popup_ok_btn'){
        closePopUp();
    }
    if (t.id == 'window_small_ok_btn'){
        if (actions.createSessionPopUp){
            let name = document.getElementById('small_window_session_name').value;
            let puzzle =  document.getElementById('small_window_session_puzzle').value;
            createSession({name: name, puzzle: puzzle});
        }
        closeWindowSmallPopUp();
        closeWindow();
    }
    if (t.id == 'popup_remove_btn'){
        let index = t.dataset.index;
        removeTime(index);
        closePopUp();
    }   
    if (t.id == 'mean_button'){
        loadMakeSureDeleteMessage();
    }
    if (t.id == 'info_session_switch_btn') loadSessionsWindow();
    if (t.id =='popup_remove_btn'){
        let type = t.dataset.type;
        if (type == 'all_times'){
            removeAllSessionTimes();
            closePopUp();
        }
    }
    if (t.id == 'window_close_btn'){
        closeWindow();
    }
    if (t.id == 'sessoion_create_btn') loadCreateSessionPopUp();
    if (t.id == 'info_new_scramble_btn') getNewScramble();
    if (t.classList.contains('session_card')){
        let index = t.dataset.index;
        let sessionID = savableData.mainData.sessions[index].id;
        if (currentSession.id != sessionID){
            loadSession(sessionID);
            closeWindow();
        } 
    }
    if (t.classList.contains('times_time')){
        let index = t.parentElement.dataset.index;
        let data = timesData[index];

        data.type = 'single';
        data.index = index;
        loadPopUp(data);
    }
});   

function markAsChanged(data){
    if (changedData.includes(data)) return;
    changedData.push(data);
}

function saveData(path){
    if (!loadStatus[path] || !savableData[path].check) return;
    if (!savableData[path].path) savableData[path].path = path;
    console.log('call');
    let fileLocation = savableData[path].fileLoc;
    let fileInfo = {
        path: path,
        fileLoc: fileLocation,
        file: savableData[path]
    }
    loadStatus[path] = false;
    window.electron.send('save-data', fileInfo);
}

elements.times_content.addEventListener('scroll', (e)=> {
    // console.log(elements.times_content.scrollTop);
    // e.preventDefault();
    let top = elements.times_content.scrollTop; 
    let time_c = elements.times_content;
    let itemHeight = time_c.children.length ? time_c.children[0].offsetHeight : 0;
    let times_children = time_c.childNodes;
    let dir = actions.mouseWheelDir;
    if (top > itemHeight*4 && dir == 'down') {
        let newIndex = parseInt(times_children[times_children.length - 1].dataset.index);
        if (!newIndex || newIndex < 0) return;
        time_c.childNodes[0].remove();
        addLabelAfter(newIndex);
        actions.lastScrollPos = -9999;
        time_c.scrollTop -= 0;
        return;
    }else if (top < itemHeight*4 && dir == 'up'){
        let newIndex = parseInt(times_children[0].dataset.index) + 1;
        if (!newIndex || newIndex > timesData.length - 1) return;
        time_c.childNodes[times_children.length-1].remove();
        addLabelBefore(newIndex);
        actions.lastScrollPos = itemHeight * 6;
        return;
    }
    actions.lastScrollPos = top;

});

window.addEventListener('wheel', (e) =>{
    actions.mouseWheelDir = e.deltaY < 0 ? 'up' : 'down';
    actions.mouseMove = e.deltaY;
})

window.addEventListener('beforeunload', (e) => {
    for (let i = 0; i < changedData.length; i++){
        saveData(changedData[i]);
    }
    // let isSaving = saveAllTimes({closing: true});
    // if (0){
    //     // e.preventDefault();
    //     return false;
    // }
});

window.electron.receive('close-app', () => {
    window.close();
})

window.electron.receive('load-data', (save) => {
    if (loadStatus[save.path]){
        if (save.data.fileLoc == 'sessions') loadSessionTimes(savableData[save.path]);
        return;
    }

    savableData[save.path] = save.data;
    loadStatus[save.path] = true;

    if (save.data.fileLoc == 'sessions') loadSessionTimes(save.data);

    if (!actions.appLoaded){
        if (checkForRequiredLoaded()){
            loadApp();
        }
    
        updateProgressWindow();
    }
});

function createSession(data = {}){
    console.log('this')
    let mainData = savableData.mainData;
    let numberOfSessions = mainData.numberOfAllSessions ? mainData.numberOfAllSessions : 0;
    let session = {
        id: numberOfSessions,
        name: data.name.length ? data.name : '',
        puzzle: data.puzzle,
        mode: data.mode && data.mode.length ? data.mode : 'classic',
    }
    loadData('session'+session.id, {isSession: true, fileLoc: 'sessions'});
    currentSession = session;
    numberOfSessions++;
    mainData.numberOfAllSessions = numberOfSessions;
    
    markAsChanged('mainData');

    if (!mainData.sessions) mainData.sessions = [];
    mainData.sessions.push(session);
    
    loadSession();
}

function getSessionName(){
    if (!currentSession.id && currentSession.id !== 0) return false;
    let name = 'session'+currentSession.id;
    return name;
}

function removeTime(index){
    if (index > timesData.length - 1) return;
    timesData.splice(index, 1);

    let oldRecords = {
        ao5: actions.sessionBest.ao5.time,
        ao12: actions.sessionBest.ao12.time
    }
    loadAllRecords();
    calculateMean();
    updateLoadedDivs();
    updateNeedTimes();


    if (oldRecords.ao5 > actions.sessionBest.ao5.time){
        elements.n_ao5.style.display = 'block';
        elements.notification.style.display = 'block';
        actions.notificationShown = true;
        actions.notificationIter = 0;
    }
    if (oldRecords.ao12 > actions.sessionBest.ao12.time){
        elements.n_ao12.style.display = 'block';
        elements.notification.style.display = 'block';
        actions.notificationShown = true;
        actions.notificationIter = 0;
    }

    let sessionName = getSessionName();
    markAsChanged(sessionName);
}
function updateLoadedDivs(){
    let nodes = elements.times_content.childNodes;
    for (let i = 0; i < nodes.length; i++){
        // console.log(i);
        let node = nodes[i];
        let index = parseInt(node.dataset.index);
        if (index > timesData.length-1){
            node.remove();
            i--; // dont skip a node
            continue;
        }
        let data = timesData[index];
        
        let avgs = getAvgAtIndex(index)[0];
        
        node.childNodes[5].innerText = convertMilisToTime(avgs.ao5);
        if (data.newTimes && data.newTimes.ao5) node.childNodes[5].classList.add('newRecord_time');
        else node.childNodes[5].classList.remove('newRecord_time');
        node.childNodes[7].innerText = convertMilisToTime(avgs.ao12);
        if (data.newTimes && data.newTimes.ao12) node.childNodes[7].classList.add('newRecord_time');
        else node.childNodes[7].classList.remove('newRecord_time');

        node.childNodes[1].innerText = index + 1;
        node.childNodes[3].innerText = convertMilisToTime(data.time);
        if (data.newTimes && data.newTimes.single) node.childNodes[3].classList.add('newRecord_time');
        else node.childNodes[3].classList.remove('newRecord_time');
    
    }
}

function loadAllRecords(){
    actions.sessionBest = {
        single: 0,
        ao5: 0,
        ao12: 0
    }
    for (let i = 0; i < timesData.length; i++){
        timesData[i].newTimes = {};
        let newAvg = getAvgAtIndex(i)[1];
        
        let newBest = updateBestSingle({time: timesData[i].time});
        timesData[i].newTimes = {
            single: newBest.session,
            ao5: newAvg.ao5.session,
            ao12: newAvg.ao12.session,
        };
    }
}

function loadSessionTimes(data){
    if (!data.arr) data.arr = [];
    timesData = data.arr;
    zeroSessionTimeFields();
    loadAllRecords();
    loadTimesDiv();
    calculateMean();
    calculateAo();
    updateNeedTimes();
    updateTimeDistribution();
}
function addTimes(num, time){
    for (let i = 0; i < num; i++){
        simulateTimerStop(time);
    }
}
function addRandomTimes(num){
    for (let i = 0; i < num; i++){
        let time = Math.floor(Math.random() * 10000);
        simulateTimerStop(time);
    }
}

function loadSession(sessionID){
    if ((sessionID === undefined || sessionID === null) && currentSession.id === undefined) return;

    currentTime = 0;
    currentAo5 = 0;
    currentAo12 = 0;

    actions.sessionBest = {
        single: 0,
        ao5: 0,
        ao12: 0
    };

    if (sessionID+1 && sessionID !== currentSession.id){
        // gets the data of session with this id
        
        currentSession.id = sessionID;

        let name = getSessionName();

        if (name) loadData(name, {isSession: true, fileLoc: 'sessions'});
    }
    if (savableData.mainData.sessionID != currentSession.id) {
        savableData.mainData.sessionID =  currentSession.id;
        markAsChanged('mainData');
    }
        
    let session = getSessionById(sessionID);
    let name = session.name && session.name.length ? session.name : 'session '+session.id;
    elements.sessions_title_name.innerText = `"${name}"`;
    actions.currentSession = getCurrentSession();
    getNewScramble(options.currentPuzzle);
}
function updateProgressWindow(){
    let loadProcentage =  Object.keys(loadStatus).length / requriedToStart.length;
    let content = `
    <div id='loadAppTitle'>${appTitle}</div>
    <div id='loadProgress'>
        ${Math.floor(loadProcentage*100)}%
    </div>
    `;
    elements.loadScreen.innerHTML = content;
}

function checkForRequiredLoaded(){
    for (let i = 0; i < requriedToStart.length; i++){
        let file = requriedToStart[i];
        if (!loadStatus[file.name]) return false;
    }
    return true;
}

for (let i = 0; i < requriedToStart.length; i++){
    let file = requriedToStart[i];
    let data = file.data;
    loadData(file.name, data);
}
function changeTimerMode(newMode){
    savableData.mainData.timerMode = newMode;
    markAsChanged('mainData');
}
function loadTimerTypeMode(){
    elements.time.innerHTML = `
    <div id='timer_textfield'>
        <input id='timer_time_input' type='number' />
    </div>`;

    elements.timer_time_input = document.getElementById('timer_time_input');
    elements.timer_time_input.addEventListener('keypress', (e) => {
        if (e.key == "Enter"){
            actions.timerStarted = true;
            if (!e.target.value || e.target.value <= 0) return;
            currentTime = e.target.value * 10;
            stopTimer();
            e.target.value = '';
        }
    });    
}

function updateNeedTimes(){
    let needText = '(You need ';
    let times = getTimeNeededForNewAvgs();
    if (!times){
        elements.timer_need_ao5.innerText = '';
        elements.timer_need_ao12.innerText = '';
        return;
    };

    if (times.ao5) elements.timer_need_ao5.innerText = needText + convertMilisToTime(times.ao5) + ')';
    else elements.timer_need_ao5.innerText = '';

    if (times.ao12) elements.timer_need_ao12.innerText = needText + convertMilisToTime(times.ao12) + ')';
    else elements.timer_need_ao12.innerText = '';
}

function loadApp(){
    if (actions.appLoaded) return;
    elements.loadScreen.style.display = 'none';
    savableData.mainData.location = 'classic';
    if (!savableData.mainData.timerMode) savableData.mainData.timerMode = 'space'; 
    if (savableData.mainData.appVersion != version){
        savableData.mainData.appVersion = version;
        console.log('app updated!');
        markAsChanged('mainData');
    }

    let mainData = savableData.mainData;

    if (mainData.timerMode == 'type') loadTimerTypeMode();

    if (mainData.location && mainData.sessionID+1){
        loadSession(mainData.sessionID);
        console.log('session id %d loaded', mainData.sessionID);
    }
    if (!getCurrentSession()){
        createSession({puzzle: '2x2', mode: 'classic'}); // FIXME: this is just for debug
    }
    // simulateTimerStop();
    mainLoop();
    actions.appLoaded = true;
}
function getScrambleImage(moves, cubeType = '2x2'){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const { cubeArr, moveF, moveU, moveR} = generateCube2D(cubeType);

    // moves = `R F' U' R F2 R' F R F`;

    let moveArr = moves.split(' ');
    // console.log(moveArr);

    let i = 0;
    const move = () => {
        if (i >= moveArr.length) return;
        let moveType = moveArr[i][0];
        let moveQ = moveArr[i][1];
        let amm = moveQ == "'" ? 3 : +moveQ || 1;
        // if (amm)amm = 1;
        // console.log(moveArr[i], amm);
        if (moveType == 'U'){
            moveU(amm)
        }
        if (moveType == 'R'){
            moveR(amm);
        }
        if (moveType == 'F'){
            moveF(amm);
        }
        i++;
    }
    for (let j = 0; j < moveArr.length; j++){
        move();
    }
    document.addEventListener('keydown', (e) => {
        if (e.key == 'n'){
            move();
            reDraw();
        }
    })

    // moveF();
    // moveR(3);
    // moveU(2);
    // moveF(2);

    const squareSize = 40;
    const padding = 30;

    const faceSize = {
        x: cubeArr[0][0].length * squareSize,
        y: cubeArr[0].length * squareSize
    }

    const showFaceNumbers = true;

    canvas.height = faceSize.y * 3 + padding;
    canvas.width =  faceSize.x * 4 + padding;
    // ctx.fillStyle = '#777';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    const colors = ['orange', '#1c8f17', 'red', '#1a4bbf', 'white', 'yellow'];
    const positions = [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 1, y: 0}, {x: 1, y: 2}]

    const reDraw = () => {
        for (let i = 0; i < cubeArr.length; i++){
            let face = cubeArr[i];
            let pos = positions[i];
            let startX = pos.x * faceSize.x;
            let startY = pos.y * faceSize.y;
            let gapX = 5*pos.x+5;
            let gapY = 5*pos.y+5;
            for (let y = 0; y < face.length; y++){
                for (let x = 0; x < face[y].length; x++){
                    let color = colors[face[y][x]];
                    ctx.fillStyle = color;
                    ctx.fillRect(startX + x * squareSize + gapX, startY + y * squareSize + gapY, squareSize, squareSize);
                }
            }
    
            // outlines
            ctx.lineWidth = 2;
            ctx.strokeRect(startX+gapX, startY+gapY, faceSize.x, faceSize.y);
            // lines
            ctx.beginPath();
            for (let x = 0; x < face[0].length - 1; x++){
                ctx.moveTo(startX+gapX + squareSize*(x+1), startY+gapY);
                ctx.lineTo(startX+gapX + squareSize*(x+1), startY+gapY + faceSize.y);
            }
            for (let y = 0; y < face.length - 1; y++){
                ctx.moveTo(startX+gapX, startY+gapY + squareSize * (y + 1));
                ctx.lineTo(startX+gapX + faceSize.x, startY+gapY + squareSize * (y + 1));
            }
            ctx.closePath();
            ctx.stroke();
    
            if (showFaceNumbers){
                ctx.fillStyle = 'black';
                ctx.font = '20px Arial'
                ctx.fillText(i, startX+gapX + faceSize.x / 2 + 10, startY+gapY + faceSize.y / 2 - 7);
            }
        }
    }
    reDraw();

    canvas.style.position = 'fixed';
    canvas.style.right = '0px';
    canvas.style.bottom = '0px';
    document.body.appendChild(canvas);
}

function generateCube2D(cubeType = '3x3'){
    const cubeArr = [];
    let squaresPerFace = getSquaresPerFace(cubeType);

    for (let i = 0; i < 6; i++){
        const face = [];
        for (let j = 0; j < squaresPerFace.secondNum; j++){
            face.push(new Array(squaresPerFace.firstNum).fill(i));
        }
        cubeArr.push(face);
    }

    const moveF = (moveBy = 1) => {
        let facesToSlide = [5, 0, 4, 2];
        // what to replace
        let startIdxs = [0, 0, 0, 1, 1, 0, 0, 0];
        let currentFace = 1; // face to rotate
        rotateFace(moveBy, currentFace);
        // calculate changes
        moveBy = clamp(moveBy, 0, 4);
        let changes = [];
        for (let i = 0; i < facesToSlide.length; i++){
            let previousIndex = i-moveBy < 0 ? 4 + (i - moveBy) : i-moveBy;
            const sampleFrom = cubeArr[facesToSlide[previousIndex]];
            // console.log(sampleFrom);
            // 0 0 - 0 1
            // 0 1 - 1 1
            // 1 0 - 1 1
            // 0 0 - 1 0
            let start = {
                y: startIdxs[i * 2] * squaresPerFace.secondNum,
                x: startIdxs[i * 2 + 1] * squaresPerFace.firstNum
            }
            if (start.x) start.x -= 1;
            if (start.y) start.y -= 1;

            let mod = i % 2;
            let end = mod ? squaresPerFace.firstNum : squaresPerFace.secondNum;

            // console.log(facesToSlide[i], facesToSlide[previousIndex]);
            for (let j = 0; j < end; j++){
                let addToX = mod ? 0 : j;
                let currPos = { // to replace
                    x: start.x + addToX,
                    y: start.y + j - addToX
                }
                // console.log(currPos);
                let samplePos = rotateCoords(currPos.x, currPos.y, 4 - moveBy); // inverse rotation
                // console.log(samplePos, sampleFrom[samplePos.i][samplePos.j]);
                changes.push({x: currPos.x, y: currPos.y,
                    new: sampleFrom[samplePos.i][samplePos.j],
                    face: facesToSlide[i]
                });
            }
        }
        // apply changes
        for (let i = 0; i < changes.length; i++){
            let change = changes[i];
            const face = cubeArr[change.face];
            face[change.y][change.x] = change.new;
        }
    }
    const moveU = (moveBy = 1) => {
        let facesToSlide = [0, 1, 2, 3];
        let currentFace = 4; // face to rotate
        rotateFace(moveBy, currentFace);

        let changes = [];
        for (let i = 0; i < facesToSlide.length; i++){
            let previousIndex = (i+moveBy) % 4;
            const sampleFrom = cubeArr[facesToSlide[previousIndex]];
            changes.push({face: facesToSlide[i], new: sampleFrom[0]});
        }
        // apply changes
        for (let i = 0; i < changes.length; i++){
            let change = changes[i];
            cubeArr[change.face][0] = changes[i].new;
        }
    }
    const moveR = (moveBy = 1) => {
        let facesToSlide = [5, 1, 4, 3];

        rotateFace(moveBy, 2); // rotate right face
        let changes = [];
        for (let i = 0; i < facesToSlide.length; i++){
            let previousIndex = i-moveBy < 0 ? 4 + (i - moveBy) : i-moveBy;
            const sampleFrom = cubeArr[facesToSlide[previousIndex]];
            let x = 0;
            if (facesToSlide[i] != 3){ // not back face
                x = sampleFrom[0].length-1;
            }
            
            for (let j = 0; j < sampleFrom[0].length; j++){
                let coords = {
                    i: j,
                    j: x
                }
                if (facesToSlide[i] == 3 || facesToSlide[previousIndex] == 3){
                    coords = rotateCoords(x ,j, 2);
                }
                changes.push({x: x, y: j, new: sampleFrom[coords.i][coords.j], face: facesToSlide[i]});
            }
        }
        // apply changes
        for (let i = 0; i < changes.length; i++){
            let change = changes[i];
            cubeArr[change.face][change.y][change.x] = changes[i].new;
        }
    }
    const rotateFace = (moveBy, index) => {
        // 0 0 - 0 1
        // 0 1 - 1 1
        // 1 1 - 1 0
        // 1 0 - 0 0

        // currY, currX => (the same as currX), height - currY
        // 2 1 - 1 1 
        // 2 2 - 2 1
        // 1 1 - 1 0

        // 5 x 5
        // 1 1 - 1 3
        // 2 3 - 2 1
        // 3 3 - 3 1
        // 4 4 - 4 0 
        // 2 4 - 4 2
        // 1 2 - 2 1
        // 0 3 - 3 4
        // 0 2 - 2 4 
        // 0 0 - 1 0
        /**
         * @type {Array}
         */
        let face = cubeArr[index];
        let newFace = [];
        for (let i = 0; i < face[0].length; i++){
            newFace.push([]);
            for (let j = 0; j < face.length; j++){
                newFace[i][j] = face[i][j];
            }
        }
        const positions = [
            {
                Sx: 0,
                Sy: 0,
                Fx: face[0].length,
                Fy: Math.ceil(face.length / 2)
            },
            {
                Sx: 0,
                Sy: 0,
                Fx: Math.ceil(face[0].length / 2),
                Fy: face.length,
            },
            {
                Sx: Math.ceil(face[0].length / 2),
                Sy: 0,
                Fx: face[0].length,
                Fy: face.length
            },
            {
                Sx: 0,
                Sy: Math.ceil(face.length / 2),
                Fx: face[0].length,
                Fy: face.length
            },
            
        ]
        for (let i = 0; i < 4; i++){
            let pos = positions[i];
            for (let x = pos.Sx; x < pos.Fx; x++){
                for (let y = pos.Sy; y < pos.Fy; y++){
                    let rPos = rotateCoords(x, y, moveBy);
                    newFace[rPos.i][rPos.j] = face[y][x];
                    // console.log(`${y}, ${x} => ${x}, ${face.length - 1 - y}`);
                }                    
            }
        }
        cubeArr[index] = newFace;
    }
    const rotateCoords = (currX, currY, rotateBy = 1) => {
        // currY, currX => (the same as currX), height - currY 
        // 0 0 - 1 1
        // 0 1 - 1 0
        let pos = {
            i: currX,
            j: squaresPerFace.secondNum - 1 - currY
        }
        if (rotateBy == 2){
            pos = {
                i: squaresPerFace.firstNum - 1 - currY,
                j: squaresPerFace.secondNum - 1 - currX
            }
        }
        if (rotateBy == 3){
            pos = {
                i: squaresPerFace.firstNum - 1 - currX,
                j: currY
            }            
        }
        return pos;
    }
    return {cubeArr, moveF, moveU, moveR};
}
function getSquaresPerFace(cubeType){
    let firstNum = +cubeType.substring(0, cubeType.indexOf('x'));
    let secondNum = +cubeType.substring(cubeType.indexOf('x')+1, cubeType.length);
    return {firstNum, secondNum};
}
function randomInt(to){
    return Math.floor(Math.random() * to);
}
function clamp(value, min, max){
    return Math.max(Math.min(value, max), min);
}
getScrambleImage('');