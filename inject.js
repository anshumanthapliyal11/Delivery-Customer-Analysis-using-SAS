var configData;
var current = new Date();
var engageInjectCookie;
var injectId = 'inject' + (Math.floor(Math.random() * 100001) + 200);
var buttonBgColor = '#ff751a';
var buttonColor = '#ffffff';
var modalFrameName = 'engageModalFrame';
var engageMenuDivName = 'engageMenuDiv';
var engageMenuDaysLeftDivName = 'engageMenuDaysLeftDiv';
var engageMenuAutoHideDivName = 'engageMenuAutoHideDiv';
var modalFrameVisible = false;
var tourRunning = false;
var identititesFrameVisible = false;
var lastredirectEvent = {};
var watchedVariables = [];
var browserInfo = {
    "browserName": 'unknown',
    "fullVersion": 'unknown',
    "navigatorName": 'unknown',
    "navigatorAgent": 'unknown',
    "isIE": false,
    "isEdge": false
}
// console.log('inject start: ' + injectId)

function createScript(src) {
    let script1 = window.document.createElement('script');
    script1.setAttribute('src', src);
    window.document.head.appendChild(script1);
}

function removejscssfile(filename, filetype){
    var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none" //determine element type to create nodelist from
    var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" //determine corresponding attribute to test for
    var allsuspects=document.getElementsByTagName(targetelement)
    for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
        if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null)
            console.log(allsuspects[i].getAttribute(targetattr));
        if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1){
            console.log('FOUND ' + allsuspects[i].getAttribute(targetattr));
            allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
        }
    }
}

function createCss(src) {
    let css1 = window.document.createElement('link');
    css1.rel = 'stylesheet';
    css1.href = src;
    window.document.head.appendChild(css1);
}
let injectShared = window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/inject_shared.js';
let oktaScript = window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/okta_dist/okta-auth-js.min.js';
createCss(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/enjoyhint_custom.css');
createCss(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/style.css');
createCss(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/engagemodal.css');
createCss(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/epmenu-font-styles.css');

// createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/js/fontawesome-all.js');
createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/fontawesome/js/all.js');
createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/engagemodal.js');
// createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/enjoyhint_custom.js');

if (window.engageparams.interface != 'studio') {
    // console.log(window.engageparams.interface);
    createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/enjoyhint_custom_test.js');
    createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/kinetic.js');
} else {
}

function bindEvent(element, eventName, eventHandler) {
    if (element.addEventListener) {
        element.addEventListener(eventName, eventHandler, false);
    } else if (element.attachEvent) {
        element.attachEvent('on' + eventName, eventHandler);
    }
}

function loadPayLoad(e) {
    if (e.data) {
        try {
            let payload = JSON.parse(e.data);

            if (payload.command == "engageShowModal") {
                showModalFrame(payload);
            } else if (payload.command == "engageHideModal") {
                // logline(getErrorObject(), payload);
                hideModalFrame(payload);
            } else if (payload.command == "engageUpdateProd") {
                prod = payload.prod;
            } else if (payload.command == "engageCheckVars") {
                initMessages();
            } else if (payload.command == "setCurrentUser") {
                if (!payload.id && (payload.LOGIN || payload.VISITOR_EMAIL))
                    payload.id = payload.LOGIN || payload.VISITOR_EMAIL;

                hideProfileLoginFrame();
                storeCurrentUser({"id":(payload.LOGIN || payload.VISITOR_EMAIL)}, function (retCurrUser) {
                    if (!configData || !configData.perms)
                        loadUserAndConfig(retCurrUser);
                });
            } else if (payload.command == "failedCurrentUser") {
                //TODO
                //FAILED LOGIN TO VIYA or JUPYTER?
                console.error('login failed');
            } else if (payload.command == "failedCurrentProfileUser") {
                //TODO
                console.error('profile login failed');
                let configurl = engageshared.engageservicesroutes.find(x => x.id == 'auth').route;
                redirectAuth(configurl);
            } else if (payload.command == "loadCanExtend") {
                //TODO
                console.error('loadCanExtend');
            } else if (payload.command == "loadPermissions") {
                loadConfig(function(ret){
                    // logline(getErrorObject(), 'checkDaysLeft 1');

                    // createEngageMenu();
                    enableDisableButtons();
                    checkDaysLeft();
                })
            } else if (payload.command == "reloadUser") {
                // logline(getErrorObject(), 'reloadUser');
                loadUserAndConfig();
            }
            else {
                // logline(getErrorObject(), '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
                // logline(getErrorObject(), e.data);
                // logline(getErrorObject(), '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
            }
        } catch (ex) {
        }
    }
}

function sendMessageToEngageFrame(msg, frameId) {
    let iframeElement = $("[id="+frameId+"]");
    msg.created = Date.now();
    let stringMsg = JSON.stringify(msg);
    if (iframeElement && iframeElement.length > 0) {
        try {
            iframeElement[0].contentWindow.postMessage(stringMsg, '*');
        } catch (ex) {
            console.error('err send message: ' + ex.message);
        }
    }
}

function calcTimeTaken(funcname) {
    let millSinceLast = new Date() - new Date(current);
    current = new Date();
    // logline(getErrorObject(), funcname + " Since Last: " + millSinceLast);
}

//CANNOT BE CALLED FROM ANGULARJS APPLICATION
function serviceCall(svcurl, callback, skipheaders) {
    svcurl = svcurl.replace('http://trials.demo.sas.com/', 'https://trials.sas.com/')
    let xhttp = new XMLHttpRequest();
    xhttp.onload  = function () {
        let response = '';
        try{
            response = JSON.parse(xhttp.responseText);
        } catch(ex) {
            response = xhttp.responseText;
        }
        callback(response);
    };
    xhttp.open("GET", svcurl, true);
    if (!skipheaders)
        xhttp = getEngageHeaders(xhttp);
    xhttp.send();
}

function storeRedirectEvent (redirectEvent) {
    if (JSON.stringify(lastredirectEvent) !== JSON.stringify(redirectEvent)) {
        lastredirectEvent = JSON.parse(JSON.stringify(redirectEvent));
        try {
            redirectEvent.q = configData.perms.q;
            redirectEvent.originalUrl = window.location.href;
            redirectEvent.browserInfo = getBrowserInfo();
        } catch (ex) {
            logline(getErrorObject(), 'engageAPIConfig.browserInfo err:' + ex.message)
        }
        let murl = engageshared.engageservicesroutes.find(x => x.id == 'm').route;
        let urlpath = murl + 'redirectevent?';
        if (redirectEvent.q && redirectEvent.q != 'default')
            urlpath += 'q=' + window.encodeURIComponent(redirectEvent.q) + '&';

        if (redirectEvent.message)
            urlpath += 'message=' + window.encodeURIComponent(redirectEvent.message) + '&';

        if (redirectEvent.redirectUrl)
            urlpath += 'redirectUrl=' + window.encodeURIComponent(redirectEvent.redirectUrl) + '&';

        if (redirectEvent.originalUrl)
            urlpath += 'originalUrl=' + window.encodeURIComponent(redirectEvent.originalUrl) + '&';

        if (redirectEvent.browserInfo)
            urlpath += 'browserInfo=' + window.encodeURIComponent(JSON.stringify(redirectEvent.browserInfo)) + '&';

        if (redirectEvent.q && redirectEvent.q == 'default'){
            //SKIPPED
        } else {
            $.get(urlpath, function (data, status) {
                try {
                    if (typeof data == 'string')
                        JSON.parse(data);
                } catch (e) {
                    console.error(e);
                }
                // logline(getErrorObject(), 'posted redirect event');
            }).fail(function(err, status) {
                logline(getErrorObject(), err);
                // logline(getErrorObject(), 'error redirect event');
            });
        }
    } else {
        //SKIPPED
    }
}

//*************************************
// USER FUNCTIONS START
//*************************************

function storeCurrentUser(data, callback, count) {
    if (!count)
        count = 0;
    if (count > 10) {
        callback();
    } else {
        // logline(getErrorObject(),  data)
        if (data.id) {
            if (data.id == 'Robert.Jordan@sas.com' || data.id == 'rojord@wnt.sas.com') {
                //     window.engageparams.user = data.id;
                //     console.log('loading for user: ' + data.id);
                //createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/enjoyhint_custom_test.js');
                //createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/js/kinetic.js');
            }
            let configurl = engageshared.engageservicesroutes.find(x => x.id == 'menuconfiguration').route;
            serviceCall(configurl + 'currentuser?user=' + encodeURIComponent(JSON.stringify(data)), function (ret, err) {
                if (err){
                    logline(getErrorObject(), err);
                }
                // logline(getErrorObject(), ret.message);
                if (ret && ret.message) {
                    //TOKEN NAME WILL CONTAIN THE CURRENT MACHINE TO ALLOW MULTIPLE MENUS RUNNING AT ONCE
                    // logline(getErrorObject(), ret.message);
                    setStorage(engageshared.engagetokenname, ret.message.token, ret.message.tokenexp)
                    callback(ret.message);
                } else {
                    // TRY AGAIN
                    setTimeout(function () {
                        count++;
                        storeCurrentUser(data, callback, count)
                    }, 200);
                }
            });
        } else {
            //jupyterhub-user-robert.jordan%40sas.com
            let jupyterhubtoken = getCookieName('jupyter-hub-token-');
            let jupyterhubuser = getCookieName('jupyterhub-user-');
            // console.log(jupyterhubtoken);
            // console.log(jupyterhubuser);
            if (jupyterhubtoken) {
                logline(getErrorObject(),  jupyterhubtoken)
                storeCurrentUser({"id":jupyterhubtoken}, callback, count)
            } else {
                engageshared.getProfileTries = engageshared.getProfileTries || 1;
                if (engageshared.engageservicesconfig.profile && engageshared.getProfileTries < 5) {
                    engageshared.getProfileTries++;
                    // logline(getErrorObject(),  engageshared.engageservicesconfig.profile)
                    // storeCurrentUser({"id":"unknown"}, callback, count)
                    getProfileUser(callback);
                } else {
                    // logline(getErrorObject(),  {"id":"unknown"})
                    storeCurrentUser({"id":"unknown"}, callback, count)
                }
            }
        }

    }
}

function getViyaUser(callback) {
    let hosturl = (new URL(window.location.href)).origin;
    serviceCall(hosturl + "/identities/users/%40currentUser", function (data, status) {
        // logline(getErrorObject(), data);
        // logline(getErrorObject(), status);
        storeCurrentUser(data, function(retCurrUser) {
            callback(retCurrUser);
        });
    });
}

function hideProfileLoginFrame(link) {
    let identitiesFrame = $("[id=" + engageshared.identitiesFrameId + "]");
    if (identitiesFrame && identitiesFrame.length > 0) {
        let iframeElement = identitiesFrame[0];
        iframeElement.style.bottom = "-1000px";
        iframeElement.style.left = "-1000px";
        iframeElement.src = 'about:blank';
    }
    try { window.document.body.removeChild(identitiesFrame[0]); } catch (e) { }
    try { window.document.body.removeChild(identitiesFrame); } catch (e) { }
    identititesFrameVisible = false;
}


function showProfileLoginFrame(link, evt) {
    let identitiesFrame = $("[id=" + engageshared.identitiesFrameId + "]");
    if (identitiesFrame && identitiesFrame.length > 0) {
        let iframeElement = identitiesFrame[0];
        identititesFrameVisible = true;
        positionModalFrame(engageshared.identitiesFrameId, identititesFrameVisible, '75%');
        // iframeElement.src = urlpath;
        // iframeElement.onload = function () {
        //     // logline(getErrorObject(), 'onload');
        // };
    }
}

//THE RESULT OF THIS WILL COME BACK ON loadPayLoad(e) FUNCTION ABOVE
function getProfileUser(callback) {
    // logline(getErrorObject(), engageshared.engagepagesroute + "/dash/currentprofileuser.html");
    let identitiesFrame = $("[id=" + engageshared.identitiesFrameId + "]");
    if (!identitiesFrame || identitiesFrame.length == 0) {
        //CREATE AN IFRAME - THIS WILL SEND A MESSAGE BACK ON bindevent -> parseMessage
        let iframe = window.document.createElement('iframe');
        iframe.id = engageshared.identitiesFrameId;
        iframe.loaded = 'false';
        iframe.allowfullscreen = 'true';
        iframe.tabindex = '0';
        iframe.style = 'width: 50%; height: 75%;max-width: 840px;overflow-x:"hidden"; overflow-y:"scroll"; border-width: 0px;display: block; ' +
            'position: absolute;z-index:999999;' +
            ' z-index: 130002; position: fixed; bottom: -1000px; top: auto; left: -1000px; right: auto;border:none;';
        // iframe.scrolling="no"
        iframe.width = '50%';
        iframe.height = '75%'; //transparent
        iframe.style.backgroundColor = "transparent";
        iframe.frameBorder = "0";
        iframe.allowTransparency = "true";
        iframe.onload = function () {
            // logline(getErrorObject(), 'onload');
        };
        let restroute = engageshared.engageservicesroutes.find(x => x.id == 'rest').route
        iframe.src = engageshared.engagepagesroute + "/dash/currentprofileuser.html?engageservicesbase=" + encodeURI(restroute);
        window.document.body.appendChild(iframe);
        callback();
    } else {
        try { window.document.body.removeChild(identitiesFrame[0]); } catch (e) { }
        try { window.document.body.removeChild(identitiesFrame); } catch (e) { }
        getProfileUser(callback);
    }
}

//*************************************
// FOURTH STEP IN THE PROCESS
// GET THE USER THAT IS LOGGED IN
//*************************************
function getUser(currUser, callback) {
    getPermissionToken(function(configtoken) {
        // logline(getErrorObject(), configtoken);
        if (configtoken && configtoken.perms && configtoken.perms.email) {
            // logline(getErrorObject(), 'RETRIEVED FROM TOKEN ' + configtoken.perms.email);
            callback(configtoken.perms);
            getViyaUser(function(ignore) {
                //IGNORE
            });
        } else {
            if (currUser && currUser.email) {
                // logline(getErrorObject(), currUser.email);
                callback(currUser);
                getViyaUser(function(ignore) {
                    //IGNORE
                });
            } else {
                getViyaUser(callback);
            }
        }
    });
}

function saveusersettings(injectTourRan, embedTourRan) {
    try {
        let this_host = engageshared.engagehostorigin || 'unknown';
        let session_tours = {
            "injectTourRan": configData.perms.injectTourRan,
            "embeddedTourRan": configData.perms.embeddedTourRan,
        }
        window.sessionStorage.setItem(this_host + "_tours", JSON.stringify(session_tours));

    } catch (ex) {
        console.error(ex);
    }

    let configurl = engageshared.engageservicesroutes.find(x => x.id == 'm').route;
    var url_path = configurl + 'users/edit?q='+ window.encodeURIComponent(configData.perms.q)
        + '&injectTourRan=' + configData.perms.injectTourRan
        + '&embeddedTourRan=' + configData.perms.embeddedTourRan
        + '&courseId=' + configData.perms.courseId;
    // logline(getErrorObject(), url_path);
    serviceCall(url_path, function (ret, err) {
        // logline(getErrorObject(), ret);
        clearStorage(engageshared.engageconfigtokenname);
        setTimeout(function(){
            loadConfig(function(ret){})
        },500);
    });
}
//*************************************
// THIRD STEP IN THE PROCESS
// GET THE USER THAT IS LOGGED IN
// AND LOAD THE CONFIGURATION FOR THE MENU
//*************************************
function loadUserAndConfig(currUser, isloser) {
    //*************************************
    // FOURTH STEP IN THE PROCESS
    // GET THE USER THAT IS LOGGED IN
    //*************************************
    // logline(getErrorObject(), currUser);
    getUser(currUser, function (retCurrUser) {
        // logline(getErrorObject(), retCurrUser);
        if (retCurrUser && retCurrUser.email) {
            //INJECT_SHARED LOAD CONFIG
            //*************************************
            // FIFTH STEP IN THE PROCESS
            // GET THE MENU CONFIGURATION (inject_shared.js)
            //*************************************
            loadConfig(function () {
                // logline(getErrorObject(), configData);
                if (configData) {
                    //*************************************
                    // SIXTH STEP IN THE PROCESS
                    // CREATE THE ACTUAL MENU
                    //*************************************
                    if (!isloser) {
                        createEngageMenu();
                        //*************************************
                        // SEVENTH STEP IN THE PROCESS
                        // CREATE THE MODAL FRAME THAT WILL BE SHOWN
                        // WHEN SHOWING PAGES FROM THE MENU
                        //*************************************
                        createModalFrame();
                        // IF DAYS LEFT IS TO BE SHOWN THIS WILL BUILD THE UI COMPONENT
                        // logline(getErrorObject(), 'checkDaysLeft 2');
                        checkDaysLeft();
                        checkDiskQuota();
                    } else {

                        // logline(getErrorObject(), 'addPendo Loser');
                        addPendo(configData.pendo_options, configData.perms, window);
                    }
                } else {
                    console.error('error: No Config');
                }
            });
        } else {
            // console.error('error: No Menu Version');
        }
    });
}

//*************************************
// USER FUNCTIONS END
//*************************************

//*************************************
// CONFIGURATION FILE FUNCTIONS START
//*************************************

function loadConfigFile(version) {
    /*if (window.engageparams && window.engageparams.configfromservices) {
        //TODO REVISIT THIS... NEED TO BE ABLE TO LOAD CONFIGURATION AND PAGES FROM MORE CONFIGURABLE MEANS
        let configurl = engageshared.engageservicesroutes.find(x => x.id == 'menuconfiguration').route;
        let svcurl = configurl  + 'config?f=' + version

        return $.get(svcurl, function (data) {
            return data;
        });
    } else {

    }*/
    if (!version)
        version = '';
    else
        version = '.' + version;
    let configurl = 'config?f=landing_config' + version + '.json'
    let urlbase =engageshared.engagemenubase + engageshared.engagemenuroute
    if (!urlbase.endsWith('/'))
        configurl = '/'+configurl;
    // logline(getErrorObject(), configurl);
    return $.get(urlbase + configurl, function (data) {
        return data;
    });
}

function getPermissionToken(callback) {
    let retToken = {
        "perms": {}
    }
    try {
        let configtoken;
        if (engageshared.engageconfigtokenname)
            configtoken = getStorage(engageshared.engageconfigtokenname);
        // logline(getErrorObject(), configtoken);
        if (configtoken) {
            let parsedToken = parseJwt(configtoken);
            retToken.perms = parsedToken;
            // logline(getErrorObject(), parsedToken);
            logline(getErrorObject(), retToken.perms.menuVersion);
            if (retToken && retToken.perms && retToken.perms.menuVersion) {
                // setCookie(engageshared.engageconfigtokenname, configtoken, engageshared.engageconfigtokenexp)
                setStorage(engageshared.engageconfigtokenname, configtoken)
                if (configData && configData.perms) {
                    if (retToken && retToken.message && retToken.message.perms) {
                        configData.perms = retToken.message.perms;
                        if  (configData.perms && !configData.perms.daysLeft) {
                            configData.daysleft.enabled = false;
                            // configData.perms.daysLeft = "- Days Left"
                            // } else {
                            //     logline(getErrorObject(), configData.perms.daysLeft + ' | TESTDAYSLEFT')
                        }

                    }
                }
            }
        }
    } catch (e) {
    }
    callback(retToken);
}

function loadPerms(callback) {
    let configurl = engageshared.engageservicesroutes.find(x => x.id == 'menuconfiguration').route;
    let svcurl = configurl  + 'load/' + engageshared.engagehostname
    // logline(getErrorObject(),  configurl)
    if (engageshared.menuversion)
        svcurl += '?menuversion=' + engageshared.menuversion

    // logline(getErrorObject(), svcurl);
    serviceCall(svcurl, function (ret) {
        if (ret && ret.message && ret.message.token){
            if (ret.message.tokenexp)
                engageshared.engageconfigtokenexp = ret.message.tokenexp;
            // setCookie(engageshared.engageconfigtokenname, ret.message.token, engageshared.engageconfigtokenexp)
            setStorage(engageshared.engageconfigtokenname, ret.message.token)

        }
        // logline(getErrorObject(), ret.message);
        if (configData && configData.perms) {
            if (ret && ret.message && ret.message.perms) {
                if (configData.perms.email != ret.message.perms.email) {
                    initialize();
                }
                configData.perms = ret.message.perms;
                if  (configData.perms && !configData.perms.daysLeft) {
                    configData.daysleft.enabled = false;
                    // configData.perms.daysLeft = "- Days Left"
                    // } else {
                    //     logline(getErrorObject(), configData.perms.daysLeft + ' | TESTDAYSLEFT')
                }
            }
            configData = buildConfig(configData);
            enableDisableButtons();
            // logline(getErrorObject(), 'checkDaysLeft 3');
            checkDaysLeft();
        }
        // logline(getErrorObject(), 'RETRIEVED FROM SERVICE');
        callback(ret.message);
    });
}

function loadPermissions(callback) {
    try {
        getPermissionToken(function(configtoken) {
            // logline(getErrorObject(), configtoken.perms.menuVersion);
            if (configtoken && configtoken.perms && configtoken.perms.menuVersion) {
                // logline(getErrorObject(), 'RETRIEVED FROM TOKEN');
                callback(configtoken);
                loadPerms(function(ignore) {
                    //IGNORE
                });
            } else {
                loadPerms(callback);
            }
        })

    } catch (e) {
        logline(getErrorObject(), e);
    }

}

function loadConfig(callback) {

    loadPermissions(function (ret) {
        if (ret && ret.perms && ret.perms.menuVersion) {
            try {
                // logline(getErrorObject(), ret.perms.menuVersion);
                loadConfigFile(engageshared.menuversion || ret.perms.menuVersion).then(function (resultversioned) {
                    // logline(getErrorObject(), '');
                    configData = resultversioned;
                    configData.perms = ret.perms;
                    if  (configData.perms && !configData.perms.daysLeft) {
                        configData.daysleft = configData.daysleft || {};
                        configData.daysleft.enabled = false;
                        // configData.perms.daysLeft = "- Days Left"
                        // } else {
                        //     logline(getErrorObject(), configData.perms.daysLeft + ' | TESTDAYSLEFT')
                    }
                    configData = buildConfig(configData);
                    let hosturl = (new URL(window.location.href)).origin;
                    serviceCall(hosturl + "/appRegistry/cadenceVersion", function (data, status) {
                        if (data && data.cadenceVersion) {
                            let cadenceVersionParts = data.cadenceVersion.split('.');
                            if (cadenceVersionParts.length == 3)
                                configData.cadenceVersion = data.cadenceVersion;
                            else
                                configData.cadenceVersion = data.cadenceVersion + '.' + data.version;
                            callback(undefined);
                        } else {
                            serviceCall(hosturl + "/licenses/grants?prodId=0", function (data, status) {
                                if (data && data.siteName) {
                                    configData.cadenceVersion = '2020.1.3';
                                    callback(undefined);
                                } else {
                                    configData.cadenceVersion = 'unknown';
                                    callback(undefined);
                                }
                            });
                        }
                    });
                });
            } catch (ex) {
                // logline(getErrorObject(), '');
                console.error('error: ' + ex.message);
                callback(ex);
            }
        } else {

            // logline(getErrorObject(), '');
            console.error('error: No Menu Version');
            callback('No Menu Version');
        }
    });
}

//*************************************
// CONFIGURATION FILE FUNCTIONS END
//*************************************

//*************************************
// TOUR FUNCTIONS START
//*************************************


function extracted(selector, elemparent) {
    try {
        // logline(getErrorObject(), selector);
        let elem = $(selector);
        // logline(getErrorObject(), elem);
        if (elem && elem[0]
            // && ((elem.position() && (elem.position().top > 0 || elem.position().left > 0))
            //     || (elem.offset() && (elem.offset().top > 0 || elem.offset().left > 0)))
        ) {
            // logline(getErrorObject(), 'found: ' + selector);
            return true;
        } else {
            if (elemparent) {
                // logline(getErrorObject(), 'using parent');
                return extracted(elemparent, undefined);
            } else {
                // logline(getErrorObject(), 'not found: ' + selector);
                return false;
            }
        }
        // logline(getErrorObject(), elem);
        return elem;
    } catch (e) {
        logline(getErrorObject(), '');
        console.error(ex.message);
        return undefined;
    }

}

function createTour(options, startFunction, skipFunction, nextFunction, exitFunction) {
    showMenuFrame(true, false, 'createTour');
    let tourOptions = JSON.parse(JSON.stringify(options));
    // logline(getErrorObject(), tourOptions);
    if (!tourOptions.disabled) {
        // logline(getErrorObject(), '');
        try {
            // let nextBtn = {className: "myNext", text: "Next"};
            // let skipBtn = {className: "myNext", text: "Done"};
            if (!startFunction) {
                startFunction = function() {
                    // logline(getErrorObject(), 'default startFunction');
                }
            }
            if (!skipFunction) {
                skipFunction = function() {
                    // logline(getErrorObject(), 'default skipFunction');
                }
            }
            if (!nextFunction) {
                nextFunction = function() {
                    // logline(getErrorObject(), 'default skipFunction');
                }
            }
            if (!exitFunction) {
                exitFunction = function() {
                    // logline(getErrorObject(), 'default exitFunction');
                }
            }
            let enjoyhint_instance = new EnjoyHint({
                onStart:startFunction,
                onSkip: skipFunction,
                onNext: nextFunction,
                onEnd: exitFunction
            });
            for (let i = tourOptions.length - 1; i >= 0; i--) {
                for (let prop in tourOptions[i]) {
                    if (tourOptions[i].hasOwnProperty(prop) && prop.split(" ")[1]) {
                        let selector = prop.substring(prop.indexOf(' '), prop.length).trim();
                        // logline(getErrorObject(), selector);
                        if (!extracted(selector, tourOptions[i].parent)) {
                            tourOptions.splice(i, 1);
                            // logline(getErrorObject(), 'break');
                            break;
                        }
                    }
                }
            }

            // logline(getErrorObject(), tourOptions);
            //set script config
            enjoyhint_instance.set(tourOptions);

            //run Enjoyhint script
            enjoyhint_instance.run();
        } catch (ex) {
            logline(getErrorObject(), '');
            console.error(ex.message);
        }
    }
    // logline(getErrorObject(), '');

}

function checkVars() {
    Object.keys(configData).forEach(function (key, index) {
        try {
            if (watchedVariables && watchedVariables.length > 0) {
                let foundvar = watchedVariables.filter((x) => x.var == key);
                for (let i = 0; i < foundvar.length; i++) {
                    if (foundvar[i].id) {
                        $('#'+foundvar[i].id).text(configData[key]);
                        if (!isNaN(configData[key]) && configData[key] > 0) {
                            $('#'+foundvar[i].id).css({"backgroundColor":"red"});
                            /* let flashtime = 300;
                             $('#'+foundvar[i].id).parent().addClass("trialactive");
                             setTimeout(function () {
                                 $('#'+foundvar[i].id).parent().removeClass("trialactive");
                                 setTimeout(function () {
                                     $('#'+foundvar[i].id).parent().addClass("trialactive");
                                     setTimeout(function () {
                                         $('#'+foundvar[i].id).parent().removeClass("trialactive");
                                         setTimeout(function () {
                                             $('#'+foundvar[i].id).parent().addClass("trialactive");
                                             setTimeout(function () {
                                                 $('#'+foundvar[i].id).parent().removeClass("trialactive");

                                             }, flashtime);
                                         }, flashtime);
                                     }, flashtime);
                                 }, flashtime);
                             }, flashtime);*/
                        } else {
                            $('#'+foundvar[i].id).css({"backgroundColor":"grey"});
                        }
                    }
                }
            }
        } catch (ex2) { //ignore errors
        }
    });
}

function initMessages() {
    if (configData.showMessages) {
        let configurl = engageshared.engageservicesroutes.find(x => x.id == 'm').route;
        var url_path = configurl + 'usermessages?q='+ window.encodeURIComponent(configData.perms.q) + '&count=1';
        serviceCall(url_path, function (ret, err) {
            if (ret.details) {
                configData.messages = ret.details.messages;
                configData.newmessages = ret.details.newmessages;
                configData.newmessagescount = ret.details.newmessages.length;
                if (configData.newmessagescount > 99)
                    configData.newmessagescount = 99;
            }
            checkVars();
            setTimeout(function() {
                initMessages();
            }, 60000);
        });
    }
}

function resetTour() {
    configData.perms.injectTourRan = 0;
    configData.perms.embeddedTourRan = 0;
    initTour();
}

function initTour(count) {
    // logline(getErrorObject(), configData.perms);
    if (!count)
        count = 0;
    let tourRan = 0;

    if (window.engageparams.interface == 'sasdrive') {
        tourRan = configData.perms.injectTourRan;
    } else {
        tourRan = configData.perms.embeddedTourRan;
    }

    if (configData && configData.perms && (!tourRan || tourRan == "0")) {
        let session_tourRan = 0;
        try {
            let this_host = engageshared.engagehostorigin || 'unknown';
            let session_tours = window.sessionStorage.getItem(this_host + "_tours");
            if (session_tours) {
                session_tours = JSON.parse(session_tours);
                if (session_tours && (session_tours.injectTourRan || session_tours.injectTourRan))
                {
                    if (window.engageparams.interface == 'sasdrive') {
                        session_tourRan = session_tours.injectTourRan;
                    } else {
                        session_tourRan = session_tours.embeddedTourRan;
                    }
                }
            }

        } catch (ex) {
            console.error(ex);
        }
        if (!session_tourRan || session_tourRan == "0") {
            let hasButton = undefined;
            let hasWelcomeDlgFirst = undefined;
            try {
                if (configData && configData.initMessage && configData.initMessage.title && configData.initMessage.message) {
                    var myConfirm = new EngageModal({
                        title: configData.initMessage.title,
                        body: configData.initMessage.message,
                        buttons: [
                            {
                                content: "Ok",
                                bindKey: 13, /* enter key */
                                callback: function(modal){
                                    modal.hide();
                                }
                            }
                        ],
                        close: {
                            closable: false,
                        }
                    });
                    myConfirm.show();
                }

                if (configData.initTourOptions) {
                    let elem = $('#' + engageMenuDivName);
                    if (elem && elem[0]
                        && ((elem.position() && (elem.position().top > 0 || elem.position().left > 0))
                            || (elem.offset() && (elem.offset().top > 0 || elem.offset().left > 0)))
                    ) {
                        hasButton = true;
                    }
                    hasWelcomeDlgFirst = $("[id^=welcomeDialog]")[0];
                    if (hasButton && !hasWelcomeDlgFirst) {
                        if (window.engageparams.interface == 'sasdrive') {
                            configData.perms.injectTourRan = 1;
                        } else {
                            configData.perms.embeddedTourRan = 1;
                        }

                        saveusersettings();
                        setTimeout(function () {
                            let startFunction = function () {
                                if (configData.tourOptions
                                    && configData.tourOptions.openmodal
                                    && configData.tourOptions.openmodal.modal_id
                                    && configData.tourOptions.openmodal.before_tour)
                                {
                                    clickEngageMenu(configData.tourOptions.openmodal.modal_id);
                                }
                                // logline(getErrorObject(), 'overwrite startFunction');
                                showMenuFrame(true, false, 'initTour createTour start');
                                tourRunning = true;
                                //ONSTART FUNCTION
                            }
                            let nextFunction = function () {
                                showMenuFrame(true, false, 'nextTour');
                            }
                            let exitFunction = function () {
                                if (configData.tourOptions
                                    && configData.tourOptions.openmodal
                                    && configData.tourOptions.openmodal.modal_id
                                    && configData.tourOptions.openmodal.after_tour)
                                {
                                    clickEngageMenu(configData.tourOptions.openmodal.modal_id);
                                }

                                // logline(getErrorObject(), 'overwrite exitFunction');
                                //ONEXIT FUNCTION
                                tourRunning = false;
                                showMenuFrame(true, true, 'initTour createTour exit');
                                // TODO
                                if (window.engageparams.interface == 'sasdrive') {
                                    configData.perms.injectTourRan = 1;
                                } else {
                                    configData.perms.embeddedTourRan = 1;
                                }
                                saveusersettings();
                            }
                            // logline(getErrorObject(), configData.tourOptions);
                            try {
                                logline(getErrorObject(), configData.click_projects);
                                if (configData.click_projects && configData.click_projects.id) {
                                    logline(getErrorObject(), configData.click_projects.id);
                                    let e1 = document.createEvent("MouseEvents");
                                    e1.initMouseEvent("mousedown", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                                    $('[id$=' + configData.click_projects.id + ']')[0].dispatchEvent(e1)
                                    setTimeout(function () {
                                        e1.initMouseEvent("mouseup", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                                        $('[id$=' + configData.click_projects.id + ']')[0].dispatchEvent(e1)
                                    }, 500);
                                }
                            } catch (e){
                                logline(getErrorObject(), e.message);
                            }
                            if (configData.click_projects && !configData.click_projects.id) {
                                $('id$=' + configData.click_projects.id).click()
                            }
                            if (!configData.tourOptions || (configData.tourOptions && !configData.tourOptions.disabled)) {
                                createTour(configData.initTourOptions,
                                    startFunction,
                                    exitFunction,
                                    nextFunction,
                                    exitFunction
                                );
                            }
                        }, 1000);
                    } else if (hasWelcomeDlgFirst) {
                        hasButton = undefined;
                        count = 0;
                    }
                }
            } catch (ex) {
                console.error(ex.message);
                hasButton = undefined;
            }
            if (!hasButton) {
                if (count < 3600) {
                    count = count + 1;
                    // logline(getErrorObject(), 'try again');
                    setTimeout(function () {
                        initTour(count);
                    }, 500);
                }
            } else {

            }
        } else {
            showMenuFrame(true, true, 'initTour no tour');
        }
    } else {
        showMenuFrame(true, true, 'initTour no tour');
    }
}

//*************************************
// TOUR FUNCTIONS END
//*************************************



//*************************************
// MENU BUTTONS FUNCTIONS START
//*************************************

function checkForExtensionUpdate(count) {
    count = count || 0;
    if (count < 20) {

        let temp_daysleft = configData.perms.daysLeft;
        setTimeout(function () {
            loadConfig(function(ret){
                enableDisableButtons();
                // logline(getErrorObject(), 'checkDaysLeft 4');
                checkDaysLeft();
                if (temp_daysleft == configData.perms.daysLeft) {
                    count++;
                    checkForExtensionUpdate(count);
                    //CHECK AGAIN
                }
            })
        }, 500)
    }
}

function clickEngageMenu(menuId, evt) {
    try {
        // logline(getErrorObject(),menuId);
        if (configData.menus && menuId) {
            for (let i = 0; i < configData.menus.length; i++) {
                let menu = configData.menus[i];
                if (menu.id == menuId) {
                    if (menuId == 'alertmessage') {
                        setTimeout(function () {
                            initMessages();
                        }, 10000)
                    } else if (menuId == 'extend') {
                        checkForExtensionUpdate();
                    }

                    // logline(getErrorObject(),menu);
                    if (menu.type == 'externalUrl') {
                        let redirectEvent = {
                            "message": "TRIALS MENU - Menu External Url",
                            "redirectUrl": menu.url
                        };
                        storeRedirectEvent(redirectEvent);

                        let windowName = '_blank';
                        window.open(menu.url, windowName);
                    } else if (menu.type == 'email') {
                        sendMail(menu);
                    } else if (menu.type == 'function') {
                        eval(menu.jsfunction);
                    } else if (browserInfo.isIE || (evt && (evt.ctrlKey || evt.shiftKey) && !menu.blockCtrlClick) || menu.type == 'internalUrl') {
                        // logline(getErrorObject(), engageshared.engagepagesroute);
                        // logline(getErrorObject(), configData.services.mainurl);
                        let menupath = engageshared.engagepagesroute + configData.services.mainurl + menu.id + "?";
                        if (configData.perms.productCode)
                            menupath += 'prod=' + window.encodeURIComponent(configData.perms.productCode) + '&';
                        menupath += 'host=' + encodeURI(engageshared.engagehostorigin) + '&';
                        if (window.engageparams.interface)
                            menupath += 'interface=' + encodeURI(window.engageparams.interface) + '&';
                        if (engageshared.engagetokenname)
                            menupath += "token=" + getStorage(engageshared.engagetokenname) + '&';
                        if (configData.cadenceVersion) {
                            if (configData.cadenceVersion.cadenceVersion)
                                menupath += 'cv=' + configData.cadenceVersion + '&';
                        }
                        if (engageshared.menuversion)
                            menupath += "menuversion=" + engageshared.menuversion + '&';

                        let windowName = '_blank';
                        if (browserInfo.isIE) {
                            windowName = 'engageMenu';
                        }

                        let redirectEvent = {
                            "message": "TRIALS MENU - Menu New Window",
                            "redirectUrl": menupath
                        };
                        storeRedirectEvent(redirectEvent);
                        window.open(menupath, windowName);
                    } else {

                        menu.command = "engageShowModal";
                        // logline(getErrorObject(),menu.command);
                        showModalFrame(menu);
                    }
                    return;
                }
            }
        }
    } catch (ex) {
        console.error(ex.message);
    }
}

var hideTimeout;
function showMenuFrame(show, timeout, origin) {
    if (configData.autoHideMenu) {
        // if (origin)
        //     console.log('origin: ' + origin);
        if (show) {
            if (hideTimeout)
                clearTimeout(hideTimeout);
            $('#' + engageMenuDivName).show();
            // logline(getErrorObject(), 'AAA|' + configData.perms.daysLeft + '|BBB')
            if (configData.daysleft && configData.daysleft.enabled && configData.perms.daysLeft)
                $('#' + configData.daysleft.daysleftDivId).show();
            else if (configData.daysleft && configData.daysleft.enabled && !configData.perms.daysLeft)
                $('#' + configData.daysleft.daysleftDivId).hide();
            $('#' + engageMenuAutoHideDivName).hide();
            if (timeout) {
                hideTimeout = setTimeout(function() {
                    showMenuFrame(false, false, 'timeout');
                }, 3000);
            }
        } else {
            $('#' + engageMenuDivName).hide();
            if (configData.daysleft && configData.daysleft.enabled)
                $('#' + configData.daysleft.daysleftDivId).hide();
            $('#' + engageMenuAutoHideDivName).show();
        }
    }
}

function enableDisableButtons() {
    if (configData && configData.menus) {
        for (let i = 0; i < configData.menus.length; i++) {
            try {
                let menu = configData.menus[i];
                let buttonelementExists = $('#engageMenuButton_' + menu.id);
                if (buttonelementExists[0]) {
                    if (menu.disabledinject) {
                        try {
                            buttonelementExists.addClass('trialdisabled');
                            buttonelementExists.prop('disabled', true);
                        } catch (e) {

                        }
                    } else {
                        try {
                            buttonelementExists.removeClass('trialdisabled');
                            buttonelementExists.prop('disabled', false);
                        } catch (e) { }
                    }
                }
            } catch (e2) { }
        }
    }
}

function disableAutoTune() {
    try {
        logline(getErrorObject(), JSON.stringify($("#__data797")));
        // logline(getErrorObject(), JSON.stringify($("[id^=sasstudiov_appContainer_banner-appSwitcher-img]")));
        // logline(getErrorObject(), $("#__page0-0-tabs--header-1-containerVerticalLayout-0-groupVerticalLayout-0").id);
        try {window.document.body.removeChild($("#__data797")[0]);} catch (e) { }
        try {window.document.body.removeChild($("#__data797"));} catch (e) { }
// $("#__page0-0-tabs--header-1-containerVerticalLayout-0-groupVerticalLayout-0")
        // try {window.document.body.removeChild(elementAutoHideExists);} catch (e) { }
        // $("#__page0-0-tabs--header-1-containerVerticalLayout-0-groupVerticalLayout-0")[0].attr('disabled',true);
    } catch (e){
        logline(getErrorObject(), e);
    }
    setTimeout(function() {
        logline(getErrorObject(), 'test')
        disableAutoTune();
    }, 2000);
}



//*************************************
// SIXTH STEP IN THE PROCESS
// CREATE THE ACTUAL MENU
//*************************************
function createEngageMenu(count) {
    if (!count)
        count = 0;
    // logline(getErrorObject(), '');
    let hasSplash = false;
    let splashContent = $("#sas-hc-splash-content");
    // logline(getErrorObject(), splashContent.is(":visible"));
    if (splashContent && splashContent[0] && splashContent.is(":visible")) {
        hasSplash = true;
    }
    if (hasSplash) {
        if (count < 100) {
            // logline(getErrorObject(), '');
            setTimeout(function () {
                count++;
                createEngageMenu(count);
            }, 100);
        }
    } else {
        // logline(getErrorObject(), '');
        if (configData && configData.perms && configData.menus) {

            if (configData.disable_auto_tune)
                disableAutoTune();
            // logline(getErrorObject(), configData.perms);
            // logline(getErrorObject(), configData.menus);

            let buttons_class = "engagenavbutton";
            let additional_style = "";
            let toolbar_class = "engagenavbar";
            let chat_buttons_class = "engagechatbutton";

            // New Style
            buttons_class = "new_" + buttons_class;
            additional_style = 'line-height: 17px; font-size: 12.44px; font-family: “AvenirNext”, -apple-system, BlinkMacSystemFont, “Segoe UI”, Roboto, Helvetica, Arial, sans-serif, “Apple Color Emoji”, “Segoe UI Emoji”, “Segoe UI Symbol”;';
            toolbar_class = "new_" + toolbar_class;
            chat_buttons_class = "new_" + chat_buttons_class;
            // logline(getErrorObject(), configData);

            if (configData.autoHideMenu) {
                let elementAutoHideExists = $('#' + engageMenuAutoHideDivName)[0];
                while (elementAutoHideExists) {
                    elementAutoHideExists = $('#' + engageMenuAutoHideDivName)[0];
                    try {window.document.body.removeChild(elementAutoHideExists);} catch (e) { }
                }
                if (!elementAutoHideExists) {
                    let engageMenuDivHide = window.document.createElement('div');
                    engageMenuDivHide.id = engageMenuAutoHideDivName;
                    engageMenuDivHide.className = toolbar_class;
                    // div.innerHTML = '';
                    /*engageMenuDivHide.innerHTML = '<button id="engageMenuButton_AutoHide" tabindex="0" class="custom-tooltip"' +
                        'style="' +
                        'line-height: normal; text-decoration: none; vertical-align: middle; white-space: normal; word-spacing: normal; ' +
                        'background-color: ' + buttonBgColor + '; ' +
                        ' color: ' + buttonColor + '; display: inline-block; z-index: 130001; ' +
                        'border-color: transparent; border-radius: 2px; width: 50px; height: 26px; border: none; outline: none; cursor: pointer;\n' +
                        'margin-right: 5px;" ' +
                        'onclick="showMenuFrame(true, true)" onmouseenter="showMenuFrame(true, true)">' +
                        '<i id="trialsChevron" class="fas fa-chevron-up fa-1x"></i>' +
                        '<span class="custom-tooltiptext">Show Menu</span>' +
                        '</button>';
*/

                    engageMenuDivHide.innerHTML += '<button id="engageMenuButton_AutoHide" class="custom-tooltip ' + buttons_class + '" style="' + additional_style + '"' +
                        ' onclick="showMenuFrame(true, true, \'autohideButton onclick\')"; onmouseenter="showMenuFrame(true, true, \'autohideButtononmouseenter\')">' +
                        '<i class="fas fa-chevron-up fa-1x"></i></button>';
                    window.document.body.appendChild(engageMenuDivHide);
                }
            }

            let elementExists = $('#' + engageMenuDivName)[0];
            while (elementExists) {
                elementExists = $('#' + engageMenuDivName)[0];
                try {window.document.body.removeChild(elementExists);} catch (e) { }
            }
            if (!elementExists) {
                let buttonsWidth = 0;
                let engageMenuDiv = window.document.createElement('div');
                engageMenuDiv.id = engageMenuDivName;

                engageMenuDiv.className = toolbar_class;
                engageMenuDiv.innerHTML = '';

                for (let i = 0; i < configData.menus.length; i++) {
                    let menu = configData.menus[i];

                    let hideOnPage = false;
                    let showOnPage = false;
                    if (menu.showonlyon && menu.showonlyon.length > 0) {
                        for (let j = 0; j < menu.showonlyon.length; j++) {
                            if (menu.showonlyon[j].startsWith('/')) {
                                if (window.location.href.includes(menu.showonlyon[j]))
                                    showOnPage = true;
                            }
                        }
                        if (showOnPage)
                            hideOnPage = false;
                        else
                            hideOnPage = true;
                    }

                    if (menu.hideonpages && menu.hideonpages.length > 0) {
                        for (let j = 0; j < menu.hideonpages.length; j++) {
                            if (menu.hideonpages[j].startsWith('/')) {
                                if (window.location.href.includes(menu.hideonpages[j]))
                                    hideOnPage = true;
                            }
                        }
                    }

                    if (configData.perms.active && !hideOnPage && (menu.enabledinject && ((menu.permissions.includes(configData.perms.userRole.toLowerCase()))
                        || ((menu.permissions.includes('owner')) && configData.perms.isOwner)))) {
                        buttonsWidth += 32;
                        let thisHtml = '';
                        thisHtml += '<button id="engageMenuButton_' + menu.id + '" tabindex="' + i + '" class="custom-tooltip ' + buttons_class + '" style="' + additional_style + '"';
                        if (menu.disabledinject)
                            thisHtml += ' trialdisabled';
                        thisHtml += '" onclick="clickEngageMenu(\'' + menu.id + '\', event);" onmouseenter="showMenuFrame(true, false, \'menubutton_onmouseenter\')" onmouseleave="showMenuFrame(true, true, \'menubutton_onmouseleave\')"';
                        if (menu.disabledinject)
                            thisHtml += ' disabled';
                        thisHtml += '>';
                        if (menu.faIcon) {
                            thisHtml += '<i class="fas ' + menu.faIcon + ' fa-1x "';
                            if (menu.disabledinject)
                                thisHtml += ' disabled';
                            thisHtml += '></i>';
                        } else if (menu.ftIcon) {
                            thisHtml += '<i class="' + menu.ftIcon + ' svg-inline--fa fa-w-20 fa-1x"';
                            thisHtml += '></i>';
                        }
                        thisHtml += '<span class="custom-tooltiptext">' + menu.text;
                        if (menu.disabledinject)
                            thisHtml += ' Unavailable';
                        thisHtml += '</span>';
                        if (menu.counter_variable) {
                            watchedVariables.push({"id":"engageMenuCounter_" + menu.id,"var":menu.counter_variable});
                            thisHtml += '<div id="engageMenuCounter_' + menu.id + '" class="engage-menu-counter">0</div>'
                        }
                        thisHtml += '</button>';



                        engageMenuDiv.innerHTML += thisHtml;
                        lastDivId = 'engageMenuButton_' + menu.id;
                    }
                }


                if (configData.chat.enabled && ((configData.chat.allowedCountries && configData.chat.allowedCountries.length > 0 && configData.perms.countryCode && configData.chat.allowedCountries.includes(configData.perms.countryCode.toLowerCase())) || (!configData.chat.allowedCountries || configData.chat.allowedCountries.length == 0))) {
                    logline(getErrorObject(), configData.chat.enabled)
                    logline(getErrorObject(), buttonsWidth)
                    buttonsWidth += 32;
                    let chatstyle = '';
                    engageMenuDiv.innerHTML += '<div id="engageChatButton" class="custom-tooltip ' + buttons_class + '" style="' + additional_style + '">' +
                        '<div id=' + configData.chat.dashChatDivId + ' style="text-align: center;' + chatstyle + '" onmouseenter="showMenuFrame(true, false, \'menubutton_onmouseenter\')" onmouseleave="showMenuFrame(true, true, \'menubutton_onmouseleave\')"></div>' +
                        '<span class="custom-tooltiptext">Live Chat</span>' +
                        '</div>';
                } else {
                    // logline(getErrorObject(), configData.chat)
                }

                if (configData.daysleft && configData.daysleft.enabled) {
                    buttonsWidth += 110;
                    engageMenuDiv.innerHTML += '<span id="' + configData.daysleft.daysleftDivId + '" style="width:110px;"></span>';
                }
                // New Style
                // logline(getErrorObject(), buttonsWidth);
                engageMenuDiv.style = "width:" + buttonsWidth + "px;";

                // logline(getErrorObject(), engageMenuDiv.innerHTML);
                window.document.body.appendChild(engageMenuDiv);

                // logline(getErrorObject(), configData.perms.daysLeft)

                // showMenuFrame(false, false, 'after menu create');
                $('#engageChatButton').hide();
                createChatDiv(configData.chat, configData.khoros_chat, window);
                // logline(getErrorObject(), 'addPendo Winner');
                addPendo(configData.pendo_options, configData.perms, window);
                initTour();
                initMessages();
                try {
                    var redirectEvent = {
                        "message": "TRIALS MENU - Initialized",
                        "redirectUrl": window.location.href
                    };
                    storeRedirectEvent(redirectEvent);
                } catch (engage_e) {}
            } else {
                // logline(getErrorObject(), 'div already exists');
            }
        }
    }
}

//*************************************
// MENU BUTTONS FUNCTIONS END
//*************************************


//*************************************
// MODAL FRAME FUNCTIONS START
//*************************************

function showModalFrame(link, evt) {
    // logline(getErrorObject(), 'test');
    if (link) {
        $('[id^=engageMenuButton_]').removeClass('trialactive');
        $('#engageMenuButton_' + link.id).addClass('trialactive')
        let modalFrame = $("[id="+modalFrameName+"]");
        if (modalFrame && modalFrame.length > 0 && link.page) {
            // logline(getErrorObject(), 'test2');
            let iframeElement = modalFrame[0];
            // logline(getErrorObject(), '');
            let urlpath = engageshared.engagepagesroute + configData.services.mainurl + link.id + "?ismodal=true&";
            if (link.prod)
                urlpath += "prod=" + link.prod + '&';
            if (engageshared.engagetokenname)
                urlpath += "token=" + getStorage(engageshared.engagetokenname) + '&';
            if (engageshared.engageconfigtokenname)
                urlpath += "config=" + engageshared.engageconfigtokenname + '&';

            urlpath += 'host=' + encodeURI(engageshared.engagehostorigin) + '&';
            if (window.engageparams.interface)
                urlpath += 'interface=' + encodeURI(window.engageparams.interface) + '&';
            if (configData.cadenceVersion)
                urlpath += 'cv=' + configData.cadenceVersion + '&';
            if (engageshared.menuversion)
                urlpath += "menuversion=" + engageshared.menuversion + '&';

            // logline(getErrorObject(), urlpath);
            let frameHeight = '75%';
            if (link.modalProperties) {
                iframeElement.style.width = link.modalProperties.width;
                iframeElement.width = link.modalProperties.width;
                iframeElement.style.height = link.modalProperties.height;
                iframeElement.height = link.modalProperties.height;
                if (link.modalProperties.height)
                    frameHeight = link.modalProperties.height
            }
            modalFrameVisible = true;
            positionModalFrame(modalFrameName, modalFrameVisible, frameHeight);
            iframeElement.src = urlpath;
            iframeElement.onload = function () {
                // logline(getErrorObject(), 'onload');
            };
            let configEvent = {
                "command": "setConfigData",
                "message": {"configData":configData}
            };
            sendMessageToEngageFrame(configEvent, modalFrameName);
            var redirectEvent = {
                "message": "TRIALS MENU - Show Modal Frame",
                "redirectUrl": urlpath
            };
            storeRedirectEvent(redirectEvent);
        } else if (link.id == 'tour') {
            // createTourEnjoyHint(embedPage.tourOptions);
        }
    }
}

function hideModalFrame(link) {
    //.addClass('fa-chevron-down')
    $('[id^=engageMenuButton_]').removeClass('trialactive');


    let modalFrame = $("[id="+modalFrameName+"]");
    if (modalFrame && modalFrame.length > 0) {
        let iframeElement = modalFrame[0];
        iframeElement.style.bottom = "-1000px";
        iframeElement.style.left = "-1000px";
        iframeElement.src = 'about:blank';
    }
    lastredirectEvent = {};
    modalFrameVisible = false;
}

function positionModalFrame(elemName, frameVisible, frameHeight) {
    // logline(getErrorObject(), '');
    let modalFrame = $("[id="+elemName+"]");
    if (modalFrame && modalFrame.length > 0 && frameVisible) {
        let iframeElement = modalFrame[0];
        if (frameHeight) {
            iframeElement.style.height = frameHeight;
            iframeElement.height = frameHeight;
        }
        let w = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;

        let h = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;

        let bottom = parseInt(iframeElement.style.bottom);
        let left = parseInt(iframeElement.style.left);

        let width = parseInt(iframeElement.width);
        let height = parseInt(iframeElement.height);
        let newLeft = (w / 4);
        if (!iframeElement.width.includes('%'))
            newLeft = (w / 2) - (width / 2);
        else
            newLeft = (w / 2) - (w * (width / 100)) / 2;

        let newBottom = (h / 4);
        if (!iframeElement.height.includes('%'))
            newBottom = (h / 2) - (height / 2);
        else
            newBottom = (h / 2) - (h * (height / 100)) / 2;
        iframeElement.style.bottom = newBottom + "px";
        iframeElement.style.left = newLeft + "px";
    }
}

function resizeEngageWindow() {
    positionModalFrame(modalFrameName, modalFrameVisible, '75%')
}

//*************************************
// SEVENTH STEP IN THE PROCESS
// CREATE THE MODAL FRAME THAT WILL BE SHOWN
// WHEN SHOWING PAGES FROM THE MENU
//*************************************
function createModalFrame() {
    let modalFrame = $("[id=" + modalFrameName + "]");
    if (!modalFrame || modalFrame.length == 0) {
        //CREATE AN IFRAME - THIS WILL SEND A MESSAGE BACK ON bindevent -> parseMessage
        let iframeElement = window.document.createElement('iframe');
        iframeElement.id = modalFrameName;
        iframeElement.loaded = 'false';
        iframeElement.allowfullscreen = 'true';
        iframeElement.tabindex = '0';
        iframeElement.style = 'width: 50%; height: 75%;overflow-x:"hidden"; overflow-y:"scroll"; border-width: 0px;display: block; ' +
            'position: absolute;z-index:999999;' +
            ' z-index: 130002; position: fixed; bottom: -1000px; top: auto; left: -1000px; right: auto;border:none;';
        // iframeElement.scrolling="no"
        iframeElement.width = '50%';
        iframeElement.height = '75%'; //transparent
        iframeElement.style.backgroundColor = "transparent";
        iframeElement.frameBorder = "0";
        iframeElement.allowTransparency = "true";
        iframeElement.onload = function () {
            // logline(getErrorObject(), 'onload');
        };
        window.document.body.appendChild(iframeElement);
    } else {
    }
}


function progressCircularBar(incomingID, incomingColor){
    var el = document.getElementById(incomingID);
    var options = {
        percent: el.getAttribute('data-percent') || 25,
        size: el.getAttribute('data-size') || 220,
        lineWidth: el.getAttribute('data-line') || 15,
        rotate: el.getAttribute('data-rotate') || 0
    }
    if (options.percent == 0)
        options.percent = 0.1;

    var canvas = document.createElement('canvas');
    var span = document.createElement('span');
    span.className = "new_engagenavbutton"
    span.textContent = options.percent + '%';
    span.style.lineHeight = options.size + 'px';


    if (typeof(G_vmlCanvasManager) !== 'undefined') {
        G_vmlCanvasManager.initElement(canvas);
    }

    var ctx = canvas.getContext('2d');
    canvas.width = canvas.height = options.size;

    el.appendChild(span);
    el.appendChild(canvas);

    ctx.translate(options.size / 2, options.size / 2); // change center
    ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI); // rotate -90 deg
//imd = ctx.getImageData(0, 0, 240, 240);
    var radius = (options.size - options.lineWidth) / 2;

    var drawCircle = function(color, lineWidth, percent) {
        percent = Math.min(Math.max(0, percent || 1), 1);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, false);
        ctx.strokeStyle = color;
        ctx.lineCap = 'butt'; // butt, round or square
        ctx.lineWidth = lineWidth
        ctx.stroke();
    };

    drawCircle('#efefef', options.lineWidth, 100 / 100);
    drawCircle(incomingColor, options.lineWidth, options.percent / 100);

    document.getElementById(incomingID).style.width = options.size+"px";
    document.getElementById(incomingID).style.height = options.size+"px";
    // span.style.width = options.size+"px";
    // span.style.lineHeight = options.size+"px";
}

let hideUsageTimeout;
let loadUsageTimeout;
let loadUsageTimer = 60000;
let maxdiskquota = 75;
let warningdiskquota = 50;
let maxdiskalertcolor = '#d60000';
let maxdiskwarningcolor = '#ff8324';
let maxdiskdefaultcolor = '#ffffff';
let lastdiskusagecollect;
function loadDiskUsage(testvar, callback) {
    let millSinceLast = new Date() - new Date(lastdiskusagecollect);
    if ((millSinceLast && millSinceLast > 30000) || !lastdiskusagecollect) {
        // logline(getErrorObject(), millSinceLast);
        lastdiskusagecollect = new Date();
        let configurl = engageshared.engageservicesroutes.find(x => x.id == 'menuconfiguration').route;
        let svcurl = configurl  + 'diskusage?testvar=' + testvar
        serviceCall(svcurl, function (ret) {
            if (ret && ret.diskUsage && configData && configData.perms){
                configData.perms.diskUsage = ret.diskUsage;
            }

            // logline(getErrorObject(), configData.perms.diskUsage);
            callback();
        });
        if (loadUsageTimeout)
            clearTimeout(loadUsageTimeout);
        loadUsageTimeout = setTimeout(function() {
            // logline(getErrorObject(), 'timer ran');
            loadDiskUsage("test1",function() {
                checkDiskQuota();
            });
        }, loadUsageTimer);
    }

}

function alertDiskQuota(color) {
    let elem = $("[id*=engageMenuButton_diskquota]")[0];
    // logline(getErrorObject(), elem);
    elem.style.color = color;
    setTimeout(function() {
        if (configData.diskquota && !configData.diskquota.clicked && configData.diskquota.percentage > maxdiskquota) {
            if (color == maxdiskalertcolor)
                alertDiskQuota(maxdiskdefaultcolor)
            else
                alertDiskQuota(maxdiskalertcolor)
        }
    }, 2000);
}
// 10737418240
// 10000000
//*************************************
// MODAL FRAME FUNCTIONS END
//*************************************

function showDiskUsageFrame(show, timeout) {
    if (show) {
        if (hideUsageTimeout)
            clearTimeout(hideUsageTimeout);
        $('#' + configData.diskquota.diskquotaDivId).show();
        if (timeout) {
            hideUsageTimeout = setTimeout(function() {
                showDiskUsageFrame(false, false);
            }, timeout);
        }
    } else {
        $('#' + configData.diskquota.diskquotaDivId).hide();
    }
}


function hideDiskUsageOverageAlert() {
    let this_host = engageshared.engagehostorigin || 'unknown';
    window.sessionStorage.setItem(this_host + "_diskquota_alert", true);
    $('#' + configData.diskquota.diskquotaDivId + '_alert').hide();
}

function khoros_click() {
    console.log('khoros_click');

    if(typeof Brandmessenger.isOpened !== 'function') {
        return;
    }

    if(Brandmessenger.isOpened()) {
        Brandmessenger.close()
    } else {
        Brandmessenger.open()
    }

    // if (Brandmessenger.isOpened()) {
    //     Brandmessenger.close()
    // } else {
    //     Brandmessenger.open()
    // }
}

// IF DAYS LEFT IS TO BE SHOWN THIS WILL BUILD THE UI COMPONENT
function checkDiskQuota(clicked, count) {
    if (configData.diskquota && configData.diskquota.enabled) {
        let this_host = engageshared.engagehostorigin || 'unknown';

        if (!count)
            count = 0;
        // configData.perms.diskUsage = 9537418

        if (configData.perms.diskUsage)
            configData.diskquota.percentage = (configData.perms.diskUsage / 5000000)*100;

        if (configData.diskquota.percentage > 100)
            configData.diskquota.percentage = 100;

        if (configData.diskquota && configData.diskquota.percentage && configData.diskquota.percentage > maxdiskquota) {

            let session_clicked = false;
            try {session_clicked = window.sessionStorage.getItem(this_host + "_diskquota");} catch (e){};
            try {session_clicked = (session_clicked === true) || (typeof session_clicked == 'string' && session_clicked === 'true') ;} catch (e){};
            // if (typeof session_clicked == 'string' && session_clicked === 'false')
            //     session_clicked = false;
            // else
            //     session_clicked = true;
            if (clicked)
                window.sessionStorage.setItem(this_host + "_diskquota", true);
            configData.diskquota.clicked = session_clicked;
            alertDiskQuota(maxdiskalertcolor)
        }else if (configData.diskquota && configData.diskquota.percentage && configData.diskquota.percentage > warningdiskquota) {
            window.sessionStorage.setItem(this_host + "_diskquota", false);
            alertDiskQuota(maxdiskwarningcolor)
        }else {
            window.sessionStorage.setItem(this_host + "_diskquota", false);
            alertDiskQuota(maxdiskdefaultcolor)
        }

        loadDiskUsage("test2",function() {});
        let alertDivId = configData.diskquota.diskquotaDivId + '_alert';
        if (configData.diskquota.percentage >= 100) {
            let session_alert = false;
            try {session_alert = window.sessionStorage.getItem(this_host + "_diskquota_alert");} catch (e){};
            try {session_alert = (session_alert === true) || (typeof session_alert == 'string' && session_alert === 'true') ;} catch (e){};
            if (!session_alert) {
                let alertElem = $("#" + alertDivId + "")[0];
                let elemInnerHtml = '<span class="progressCircularBarContainer">\n' +
                    'Your home directory is full. Some content must be deleted promptly through SAS Studio to resolve this condition.  ' +
                    'Allowing this condition to persist or worsen can result in irreversible data loss and the inability to use the site.  ' +
                    'Click the Home Directory icon below to Learn More' +
                    '<br>' +
                    '<div style="width:100%;text-align:right;"><button id="engageMenuButton_Acknowledge" style="display:inline-block;"' +
                    ' onclick="hideDiskUsageOverageAlert()">' +
                    'Ok</button></div>'
                '</span>';
                if (!alertElem) {
                    let engageQuotaAlert = window.document.createElement('div');
                    engageQuotaAlert.id = alertDivId;
                    engageQuotaAlert.className = "engagediskquotaalert";
                    // engageQuotaAlert.style = "width:100px;";
                    engageQuotaAlert.innerHTML = elemInnerHtml;
                    window.document.body.appendChild(engageQuotaAlert);
                }else {
                    alertElem.innerHTML = elemInnerHtml;
                }
                $('#' + alertDivId).show();
            }
            //
        } else {
            window.sessionStorage.setItem(this_host + "_diskquota_alert", false);
            $('#' + alertDivId).hide();
        }
        if (clicked) {
            let elem = $("#" + configData.diskquota.diskquotaDivId + "")[0];

            if (!elem) {
                let engageMenuDaysLeftDiv = window.document.createElement('div');
                engageMenuDaysLeftDiv.id = configData.diskquota.diskquotaDivId;
                engageMenuDaysLeftDiv.className = "engagediskquotaleftbar";
                // engageMenuDaysLeftDiv.style = "width:100px;";
                engageMenuDaysLeftDiv.innerHTML = '';
                window.document.body.appendChild(engageMenuDaysLeftDiv);
                setTimeout(function() {
                    checkDiskQuota(clicked, count);
                }, 60000);
            } else {
                showDiskUsageFrame(true, 5000);
                let prepend = '';
                prepend = elem.id.replace(configData.diskquota.diskquotaDivId, "");
                let elemInnerHtml = '';
                let diskUsageText = '';
                if (configData.perms.diskUsage < 1000)
                    diskUsageText = (configData.perms.diskUsage/1).toFixed(2) + 'KB';
                else if (configData.perms.diskUsage >= 1000 && configData.perms.diskUsage < 1000000)
                    diskUsageText = (configData.perms.diskUsage/1000).toFixed(2) + 'MB';
                else
                    diskUsageText = (configData.perms.diskUsage/1000000).toFixed(2) + 'GB';
                // <div className="new_engagenavbutton" style="text-align: left">Disk Quota</div>
                // elemInnerHtml = '<div class=""><div class="w3-light-gray">\n' +
                //     '  <div class="w3-container w3-blue" style="width:25%">25%</div>\n' +
                //     '</div></div>';
                elemInnerHtml ='<span onmouseenter="showDiskUsageFrame(true, false)" onmouseleave="showDiskUsageFrame(true, 1500)" class="progressCircularBarContainer">\n' +
                    'Home Directory (' + diskUsageText + '/5.0GB)' +
                    '<br>' +
                    '<table style="width:100%"><tbody><tr>' +
                    '<td style="width:60%"><span class=" progressCircularBar" id="engagediskUsageProgressCircle" data-percent="' + configData.diskquota.percentage.toFixed(1) + '" data-size="65" data-line="12"></span></td>' +
                    '<td style="text-align: right"><a href="https://vfe.sas.com/lti/docs/KB article_VFL Individual Data Upload.pdf" target="_blank" style="color: #ffffff">More Info</a></td>' +
                    '</tr></tbody></table>\n' +
                    '</span>';

                elem.innerHTML = elemInnerHtml;
                let progressColor = '#2196F3';
                if (configData.diskquota.percentage > maxdiskquota)
                    progressColor = maxdiskalertcolor;
                else if (configData.diskquota.percentage > warningdiskquota)
                    progressColor = maxdiskwarningcolor;
                progressCircularBar('engagediskUsageProgressCircle',progressColor);
            }

        } else {
            // loadDiskUsage(function() {});
        }
    }

}

// IF DAYS LEFT IS TO BE SHOWN THIS WILL BUILD THE UI COMPONENT
function checkDaysLeft(count) {
    if (!count)
        count = 0;
    if (!configData.hideDaysLeft) {
        let buttons_class = "engagenavbutton";
        let additional_style = '';
        // New Style
        buttons_class = "new_engagenavbutton";
        additional_style = 'line-height: 17px; font-size: 12.44px; font-family: “AvenirNext”, -apple-system, BlinkMacSystemFont, “Segoe UI”, Roboto, Helvetica, Arial, sans-serif, “Apple Color Emoji”, “Segoe UI Emoji”, “Segoe UI Symbol”;';

        let isJupyter = false;
        let isOnMenu = false;
        let isViya = false;
        let isStudio4 = false;

        let elemName = "login_widget";
        let elem = $("#" + elemName + "")[0];

        if (configData.daysleft && configData.daysleft.enabled) {
            elemName = configData.daysleft.daysleftDivId;
            // logline(getErrorObject(), $("#" + elemName + "").width);
            elem = $("#" + elemName + "")[0];
            // logline(getErrorObject(), elem.width);
            if (elem) {
                isOnMenu = true;
            }
        } else {
            if (elem) {
                isJupyter = true;
                // return elem;
            } else {
                elemName = "__spacer0";
                elem = $("#" + elemName + "")[0];
                if (elem) {
                    isViya = true;
                } else {
                    elemName = "mainBannerHeader";
                    elem = $("#" + elemName + "")[0];
                    if (elem) {
                        isJupyter = true;
                    } else {

                    }
                }
            }
        }

        // logline(getErrorObject(), elem);
        if (elem) {
            let prepend = '';
            prepend = elem.id.replace(elemName, "");
            let daysLeftDivId = prepend + "engageDaysLeftDiv";
            let daysLeftH1DivId = prepend + "engageDaysLeftH1";
            if (isOnMenu) {
                // elem.innerHTML = configData.perms.daysLeft + '';
                let elemInnerHtml = '<span class="' + buttons_class + '" style="' + additional_style + '">|</span>';
                // New Style
                elemInnerHtml += '<span class="' + buttons_class + '" style="' + additional_style + '" ';

                elemInnerHtml += 'id="' + daysLeftH1DivId + '" onmouseenter="showMenuFrame(true, false, \'menubutton_onmouseenter\')" onmouseleave="showMenuFrame(true, true, \'menubutton_onmouseleave\')">' + configData.perms.daysLeft;

                // New Style
                elemInnerHtml += '</span>';

                elem.innerHTML = elemInnerHtml;

            } else {

            }

        } else {
            if (count < 10) {
                setTimeout(function() {
                    count++;
                    checkDaysLeft(count);
                }, 500);
            }
            // logline(getErrorObject(), '');
        }
    }
}

//*************************************
// SECOND STEP IN THE PROCESS
// INITIALIZE THE USER/CONFIG/MENU
//*************************************
function initialize(count, force) {
    if (force){
        // logline(getErrorObject(), 'forcing');
    }
    if (!count || typeof count == 'function')
        count = 0;
    let hasArray = false;
    try {
        hasArray = ['abc', 'def', 'ghi'].includes('def');
    } catch (ex) {
        //TO SUPPORT MODERN JAVASCRIPT INCLUDE polyfill IF NEEDED
        createScript(window.engageparams.engagemenubase+window.engageparams.engagemenuroute + '/dash/css/js/polyfill.js');
    }
    // logline(getErrorObject(), engageshared.engageinjecttokenname);
    try {
        //IF inject.js IS LOADED MORE THAN ONCE WE ONLY WANT ONE TO LOAD
        engageInjectCookie = JSON.parse(getCookie(engageshared.engageinjecttokenname));
    } catch (e) {
    }
    if (force)
        engageInjectCookie = null;
    //FOR VA WE WANT TO WAIT UNTIL THE APP SWITCHER BUTTON IS ON SCREEN BEFORE LOADING
    let hasButton = (window.engageparams.interface != 'sasdrive') || $("[id*=appContainer_banner]")[0] || (count >= 10);
    if (!engageInjectCookie && hasButton) {
        //SET THE COOKIE FOR THE WINNING inject.js LOAD
        engageInjectCookie = {
            "id": injectId,
            "creation": Date.now()
        }
        // logline(getErrorObject(), 'setCookie: ' + engageshared.engageinjecttokenname);
        setCookie(engageshared.engageinjecttokenname, JSON.stringify(engageInjectCookie), null, 60000, true);

        //CAPTURE MESSAGES PASSED BETWEEN FRAMES
        bindEvent(window, 'message', function (e) {
            loadPayLoad(e);
        });
        //*************************************
        // THIRD STEP IN THE PROCESS
        // GET THE USER THAT IS LOGGED IN
        // AND LOAD THE CONFIGURATION FOR THE MENU
        //*************************************
        loadUserAndConfig();
    } else if (!engageInjectCookie) {
        //IF NO OTHERS HAVE LOADED WAIT 1 SECOND AND TRY AGAIN
        setTimeout(function () {
            count = count + 1;
            initialize(count);
        }, 1000);
    } else {
        //IF ANOTHER APPLICATION HAS ALREADY SET MENU SKIP THIS LOAD
        clearCookie(engageshared.engageinjecttokenname, true);
        loadUserAndConfig(null, true);
        if (window.engageparams.interface != 'sasdrive' && count < 10){
            // logline(getErrorObject(), window.engageparams.interface);
            setTimeout(function () {
                count = count + 1;
                //TRY AGAIN BUT FORCE THE LOAD
                //THIS CAN BE NECESSARY IF THE PREVIOUS COOKIE WAS LOADED
                //AND THEN THE PAGE WAS REFRESHED BEFORE THE COOKIE EXPIRED
                initialize(count, true);
            }, 500);
        }
    }
}

jqueryAdded = 0;
if (!window.jQuery) {
    // console.log('jquery missing');
    jqueryAdded = 1;
    createScript(window.engageparams.engagemenubase + window.engageparams.engagemenuroute + '/dash/bower_components/jQuery/dist/jquery.js');
}

function firstStep() {
    try {
        //*************************************
        // FIRST STEP IN THE PROCESS
        // WAIT FOR THE inject_shared TO LOAD
        //*************************************
        $.getScript(injectShared, function(){
            window.addEventListener("resize", resizeEngageWindow);
            browserInfo = getBrowserInfo();
            let url_path = window.engageparams.engagemenubase;
            if (!url_path.endsWith('/'))
                url_path += '/';
            url_path += 'routes';
            //GET A LIST OF ROUTES FROM THE BASE APPLICATION
            serviceCall(url_path, function (engagemenuservicesroutes, err) {
                let url_path = window.engageparams.engageservicesbase;
                if (!url_path.endsWith('/'))
                    url_path += '/';
                url_path += 'routes';
                //GET A LIST OF ROUTES FROM THE SERVICES APPLICATION
                serviceCall(url_path, function (engageservicesroutes, err) {
                    let url_path = window.engageparams.engageservicesbase;
                    if (!url_path.endsWith('/'))
                        url_path += '/';
                    url_path += 'config';
                    //GET WHETHER OR NOT WE ARE USING PROFILE
                    serviceCall(url_path, function (engageservicesconfig, err) {
                        //INITIALIZE ALL CORE VARIABLES
                        setEngageShared(new URL(window.location.href).origin
                            , window.engageparams.engagemenubase
                            , window.engageparams.engagemenuroute
                            , engagemenuservicesroutes
                            , window.engageparams.engageservicesbase
                            , engageservicesroutes
                            , engageservicesconfig
                            , window.engageparams.engagepagesroute
                            , window.engageparams.menuversion)
                        //*************************************
                        // SECOND STEP IN THE PROCESS
                        // INITIALIZE THE USER/CONFIG/MENU
                        //*************************************
                        $(document).ready(initialize);
                    },true);
                },true);
            },true);
        });
    } catch (e) {
        if (jqueryAdded > 0 && jqueryAdded < 50) {
            setTimeout(function () {
                jqueryAdded++;
                firstStep();
            }, 200);
        }
    }
}
firstStep();



