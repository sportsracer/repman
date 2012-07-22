
if (typeof require !== "undefined") {
	var Trait = require("traits").Trait;	
}

// state

function makeState(state) {
	return Trait(
		{
			get: function(property) {
				return state[property];
			},
			set: function(property, value) {
				state[property] = value;	
			},
			getState: function() {
				return state;
			}
		}
	);
}

function getterSetter(property) {
	return function(value) {
		if (typeof(value) == "undefined") {
			return this.get(property);
		}
		return this.set(property, value);
	};
}

// traits

var TPosition = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		x: getterSetter("x"),
		y: getterSetter("y"),
		angle: getterSetter("angle")
	}
);

var TPhysics = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		angle: Trait.required,
		colliding: getterSetter("colliding"),
		moveSpeed: getterSetter("moveSpeed"),
		turnSpeed: getterSetter("turnSpeed"),
		move: function(delta, walls) {

			var newX = this.x() + this.moveSpeed() * Math.cos(this.angle()) * delta
			, newY = this.y() + this.moveSpeed() * Math.sin(this.angle()) * delta
			, collision = newX < 0 || newY < 0 || newX > 31 || newY > 17;

			// check for collisions
			for (var i = 0; i < walls.length; ++i) {
				if (collision) {
					break;
				}
				var wall = walls[i];
				collision = collision || (
					Math.round(newX) == Math.round(wall.x())
					&& Math.round(newY) == Math.round(wall.y())
				);
			}

			if (!collision) {
				this.x(newX); this.y(newY);
			}
			this.colliding(collision);

			this.angle(this.angle() + this.turnSpeed() * delta);
		}
	}
);

var moveSpeedFactor = 4;
var turnSpeedFactor = Math.PI;

var TWasd = Trait(
	{
		moveSpeed: Trait.required,
		turnSpeed: Trait.required,
		input: function(w, a, s, d) {
			var move = Number(w);
			var turn = Number(d) - Number(a);
			this.moveSpeed(move * moveSpeedFactor);
			this.turnSpeed(turn * turnSpeedFactor);
		}
	}
);

var TRandomMovement = Trait(
	{
		moveSpeed: Trait.required,
		turnSpeed: Trait.required,
		randomize: function() {
			if (this.colliding()) {
				this.angle(Math.random() * Math.PI * 2);
			}
			var seed = Date.now() % 1000000;
			seed = seed * seed;
			this.moveSpeed(0.5);
			this.turnSpeed(Math.sin(Date.now() / 1000));
		}
	}
);

// engine object constructors

function makePlayer(state) {
	return Trait.create(
		Object.prototype,
		Trait.compose(makeState(state), TPosition, TPhysics, TWasd,
			      Trait({
					    getState: Trait.required
				    })
			     )
	);
}

function makeWall(x, y) {
	var state = {
		x: x,
		y: y
	};
	return Trait.create(
		Object.prototype,
		Trait.compose(makeState(state), TPosition)
	);
}

function makeTopFlop(x, y, topFlop) {
	var state = {
		x: x,
		y: y,
		angle: Math.random() * Math.PI * 2,
		speed: 0,
		moveSpeed: 0,
		turnSpeed: 0,
		topFlop: topFlop
	};
	return Trait.create(
		Object.prototype,
		Trait.compose(makeState(state), TPosition, TPhysics, TRandomMovement)
	);
}

// game object

var gamePrototype = {

	addPlayer: function() {
		this.players.push(
			makePlayer({
					   x: 8,
					   y: 8,
					   angle: 0,
					   speed: 0,
					   moveSpeed: 0,
					   turnSpeed: 0
				   })
		);
		return this.players.length - 1;
	},

	setInput: function(playerIndex, input) {
		this.players[playerIndex].input(input.w, input.a, input.s, input.d);	
	},

	tick: function() {
		var now = Date.now()
		, dt = this.lastTick != null ? (now - this.lastTick) / 1000.0 : 0;

		this.players.forEach(
			function(el) {
				el.move(dt, this.walls);
			},
			this
		);

		this.topsFlops.forEach(
			function(el) {
				el.randomize();
				el.move(dt, this.walls);
			},
			this
		);

		this.lastTick = now;
	},

	getState: function() {
		var getState = function(el) {
			return el.getState();
		};
		return {
			players: this.players.map(getState),
			walls: this.walls.map(getState),
			topsFlops: this.topsFlops.map(getState)
		};
	}
};

function makeGame() {

	var walls = [
		makeWall(4, 0),
		makeWall(4, 1),
		makeWall(4, 2),
		makeWall(4, 3),
		makeWall(8, 6),
		makeWall(9, 6),
		makeWall(10, 6),
		makeWall(11, 6),
		makeWall(9, 9),
		makeWall(10, 10),
		makeWall(11, 11)
	];

	var topsFlops = [
	];

	for (var i = 0; i < 10; ++i) {
		topsFlops.push(makeTopFlop(i, i, "top"));
		topsFlops.push(makeTopFlop(31 - i, i, "flop"));
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
		}
	};

	return Object.create(gamePrototype, gameProperties);
}

if (typeof exports !== "undefined") {
	exports.makeGame = makeGame;
}