(function () {

    var connection, timer;

    var $ = function (arg1, arg2) {
        var parent = typeof arg1 === 'string'? document : arg1;
        var selector = typeof arg1 === 'string'? arg1 : arg2;
        var els = parent.querySelectorAll(selector);
        return els.length === 0? null : (els.length === 1? els[0] : els);
    };

    function pad2 (num) {
        return num < 10? '0' + num : num;
    }

    function createConnection () {
        connection = new WebSocket('ws://' + window.location.host + '/ws');

        connection.onopen = function () {
            setActivePage('join');
        };

        connection.onmessage = function (msg) {
            try {
                msg = JSON.parse(msg.data);
            } catch (e) {
                alert('ERROR ' + msg.data);
            }

            handleMessage(msg);
        };

        connection.onerror = function () {
            getPage('connect').textContent = 'Failed to connect.';
        };
    }

    function sendMessage (msg) {
        connection.send(JSON.stringify(msg));
    }

    function setActivePage (pageName) {
        getActivePage().removeAttribute('data-active');

        [].forEach.call($('.page'), function (el) {
            var isActive = el.getAttribute('data-name') === pageName;
            if (isActive) {
                el.setAttribute('data-active', 'true');
            }

            // Auto-fill in player name into input field for join screen.
            if (isActive && pageName === 'join' && localStorage['name']) {
                $(el, 'input').value = localStorage['name'];
            }
        });
    }

    function getPage (pageName) {
        return $('.page[data-name="' + pageName + '"]');
    }

    function getActivePage () {
        return $('[data-active]');
    }

    setInterval(function () {
        if (timer) {
            var remaining = timer - Date.now();

            if (remaining > 0) {
                var minutes = Math.floor(remaining / 60000);
                var seconds = Math.floor(remaining % 60000 / 1000);
                $('.timer').textContent = pad2(minutes) + ':' + pad2(seconds);
            } else {
                $('.timer').textContent = '00:00';
            }  
        }
    }, 1000);

    
    function renderList(el, list) {
        el.innerHTML = '';
        list.forEach(function (value) {
            var child = document.createElement('div');
            child.textContent = value;
            child.setAttribute('class', 'list-item');
            el.appendChild(child);
        });
    }

    function handleMessage (msg) {
        if (msg.type === 'state') {
            if (getActivePage().getAttribute('data-name') !== 'join') {
                if (msg.active) {
                    setActivePage('game');

                    renderList($(getActivePage(), '.players'), msg.players);
                    renderList($('.locations'), msg.locations);                   

                    timer = msg.finish;
                    $('.location').textContent = msg.location;
                    $('.role').textContent = msg.role;

                    let firstEl = $(getActivePage(), '.players .list-item')[msg.first];
                    firstEl.textContent = firstEl.textContent + ' - 1st';
                } else {
                    setActivePage('lobby');
                    renderList($(getActivePage(), '.players'), msg.players);
                }
            }
        }
    }

    window.GameApp = {
        join: function () {
            var name = $(getActivePage(), 'input').value;
            if (name) {
                sendMessage({
                    type: 'join',
                    name: name
                });

                localStorage['name'] = name;
                setActivePage('lobby');
            }
        },

        start: function () {
            sendMessage({
                type: 'start-game'
            });
        },

        end: function () {
            if (confirm('Are you sure?')) {
                sendMessage({
                    type: 'end-game'
                });
            }
        }
    };

    // Begin the app.
    createConnection();

})();
