if (typeof require !== "undefined") {
	var engine = require("./engine");
}

// game object

var gamePrototype = {

	addPlayer: function(name) {
		var player = engine.makePlayer(
			{
				x: 8,
				y: 8,
				points: 0,
				index: this.players.length,
				name: name
			}
		);
		this.players.push(player);
		return player;
	},

	removePlayer: function(playerIndex) {
		this.players.splice(playerIndex, 1);	
	},

	setInput: function(playerIndex, input) {
		this.players[playerIndex].input(input.w, input.a, input.s, input.d);	
	},

	tick: function() {
		var now = Date.now()
		, dt = this.lastTick != null ? (now - this.lastTick) / 1000.0 : 0;


		this.players.forEach(
			function(player) {
				var collectedTopsFlops = player.collect(this.topsFlops);
				collectedTopsFlops.forEach(
					function(topFlop) {
						var topFlopIndex = this.topsFlops.indexOf(topFlop);
						this.topsFlops.splice(topFlopIndex, 1);
					},
					this
				);

				player.move(dt, this.walls);
			},
			this
		);

		this.topsFlops.forEach(
			function(topFlop) {
				topFlop.randomize();
				topFlop.move(dt, this.walls);
			},
			this
		);

		this.lastTick = now;

		this.countdown -= dt;
	},

	getState: function() {
		var getState = function(el) {
			return el.getState();
		};
		return {
			players: this.players.map(getState),
			walls: this.walls.map(getState),
			topsFlops: this.topsFlops.map(getState),
			countdown: this.countdown
		};
	}
};

function makeGame() {

	var walls = [
		engine.makeWall({x: 4, y: 0}),
		engine.makeWall({x: 4, y: 1}),
		engine.makeWall({x: 4, y: 2}),
		engine.makeWall({x: 4, y: 3}),
		engine.makeWall({x: 8, y: 6}),
		engine.makeWall({x: 9, y: 6}),
		engine.makeWall({x: 10, y: 6}),
		engine.makeWall({x: 11, y: 6})
	];

	var topsFlops = [];

	for (var i = 0; i < 10; ++i) {
		topsFlops.push(engine.makeTopFlop({x: i, y: i, topFlop: "top"}));
		topsFlops.push(engine.makeTopFlop({x: 31 - i, y: i, topFlop: "flop"}));
	}

	var gameProperties = {
		players: {
			value: []
		},
		walls: {
			value: walls
		},
		topsFlops: {
			value: topsFlops	
		},
		lastTick: {
			value: null,
			writable: true
		},
		countdown: {
			value: 60,
			writable: true
		}
	};

	return Object.create(gamePrototype, gameProperties);
}

if (typeof exports !== "undefined") {
	exports.makeGame = makeGame;
}