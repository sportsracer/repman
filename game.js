if (typeof require !== "undefined") {
	var engine = require("./engine");
}

// game object

var gamePrototype = {

	addPlayer: function(name) {
		var pos = this.getRandomPosition()
		, player = engine.makePlayer(
			{
				x: pos.x,
				y: pos.y,
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

	getRandomPosition: function() {
		while(true) {
			var x = Math.round(Math.random() * engine.worldWidth)
			, y = Math.round(Math.random() * engine.worldHeight)
			, occupied = false;

			this.walls.forEach(
				function(wall) {
					occupied = occupied || wall.x() == x && wall.y() == y;
				}, this
			);

			if (!occupied) {
				return { x: x, y: y };
			}
		}
	},

	tick: function() {
		var now = Date.now()
		, dt = this.lastTick != null ? (now - this.lastTick) / 1000.0 : 0;


		this.players.forEach(
			function(player) {
				var collectedTopsFlops = player.collect(this.topsFlops);
				collectedTopsFlops.forEach(
					function(topFlop) {
						var topFlopIndex = this.topsFlops.indexOf(topFlop)
						, type = this.topsFlops[topFlopIndex].topFlop()
						, pos = this.getRandomPosition()
						, that = this;
						this.topsFlops.splice(topFlopIndex, 1);
						setTimeout(function() {
								   that.topsFlops.push(engine.makeTopFlop({x: pos.x, y: pos.y, topFlop: type}));
							   }, 2000);
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

		this.timer += dt;
	},

	getState: function() {
		var getState = function(el) {
			return el.getState();
		};
		return {
			players: this.players.map(getState),
			walls: this.walls.map(getState),
			topsFlops: this.topsFlops.map(getState),
			timer: this.timer
		};
	}
};

function makeGame() {

	var walls = []
	, topsFlops = []

	, gameProperties = {
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
		timer: {
			value: 0,
			writable: true
		}
	}

	, game = Object.create(gamePrototype, gameProperties);

	for (var i = 0; i < 8; i++) {
		walls.push(engine.makeWall({x: 7, y: i + 10}));
		walls.push(engine.makeWall({x: 15, y: i}));
		walls.push(engine.makeWall({x: 23, y: i + 10}));
	}

	for (var i = 0; i < 8; ++i) {
		var pos = game.getRandomPosition();
		topsFlops.push(engine.makeTopFlop({x: pos.x, y: pos.y, topFlop: "top"}));
		topsFlops.push(engine.makeTopFlop({x: pos.x, y: pos.y, topFlop: "flop"}));
	}

	return game;
}

if (typeof exports !== "undefined") {
	exports.makeGame = makeGame;
}