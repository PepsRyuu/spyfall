const LOCATIONS = require('./locations.json').locations;
const SPY = 'Spy';

function random (max) {
    return Math.floor(Math.random() * max);
}

const Game = {
    // Public state
    state: {
        active: false,
        players: [],
        finish: -1,
        first: -1,
        locations: LOCATIONS.map(l => l.title)
    },

    // Private state
    _state: {
        location: '',
        roles: {},        
    },

    handleConnection (ws) {
        this.state.players.push({ws});
    },

    handleDisconnect (ws) {
        let index = this.state.players.findIndex(player => player.ws === ws);
        this.state.players.splice(index, 1);
        this.sendState();
    },

    handleMessage (ws, msg) {
        switch(msg.type) {
            case 'join': 
                this.handleJoin(ws, msg.name);
                break;

            case 'start-game':
                this.gameStart();
                break;

            case 'end-game': 
                this.gameEnd();
                break; 
        }
    },

    handleJoin (ws, name) {
        let index = this.state.players.findIndex(player => player.ws === ws);
        this.state.players[index].name = name;
        this.sendState();
    },

    sendState () {
        this.state.players.forEach(player => {
            let payload = Object.assign({ type: 'state' }, this.state);
            payload.role = this._state.roles[player.name] || '---';
            payload.location = payload.role === SPY? '---' : this._state.location;
            payload.players = payload.players.map(p => p.name);
            player.ws.send(JSON.stringify(payload));
        });
    },

    gameStart () {
        this.state.finish = Date.now() + (60000 * 10);
        this.state.first = random(this.state.players.length);
        this.state.active = true;

        let location = LOCATIONS[random(LOCATIONS.length)];
        let spyIndex = random(this.state.players.length);
        let availableRoles = location.roles.slice(0);

        this._state.location = location.title;
        this._state.roles = {};

        let getRole = () => {
            let roleIndex = random(availableRoles.length);
            let role = availableRoles[roleIndex];
            availableRoles.splice(roleIndex, 1);
            return role;
        };
        
        this.state.players.forEach((p, i) => {
            this._state.roles[p.name] = i === spyIndex? SPY : getRole();
        });

        this.sendState();
    },

    gameEnd () {
        this.state.active = false;
        this.sendState();
    }
};

module.exports = Game;