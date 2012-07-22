
if (typeof require !== "undefined") {
	var Trait = require("traits").Trait;	
}


const moveSpeedFactor = 4
, turnSpeedFactor = Math.PI
, worldWidth = 32
, worldHeight = 18;

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

function getterSetter(property, defaultValue) {
	return function(value) {
		if (typeof(value) == "undefined") {
			value = this.get(property); 
			return typeof(value) != "undefined"
				? value
				: defaultValue;
		}
		return this.set(property, value);
	};
}

// traits

var TPosition = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		x: getterSetter("x", 0),
		y: getterSetter("y", 0),
		angle: getterSetter("angle", 0)
	}
);

var TPhysics = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		angle: Trait.required,
		colliding: getterSetter("colliding", false),
		moveSpeed: getterSetter("moveSpeed", 0),
		turnSpeed: getterSetter("turnSpeed", 0),
		move: function(delta, walls) {

			var newX = this.x() + this.moveSpeed() * Math.cos(this.angle()) * delta
			, newY = this.y() + this.moveSpeed() * Math.sin(this.angle()) * delta

			// check for collisions
			
			, outOfGame = newX < 0 || newY < 0 || newX > (worldWidth - 1) || newY > (worldHeight - 1);

			this.colliding(
				walls.reduce(
					function(colliding, wall) {
						return colliding || (Math.round(newX) == Math.round(wall.x())
								     && Math.round(newY) == Math.round(wall.y())
								    );
					},
					outOfGame
				)
			);

			// only move object if it wouldn't be colliding in the new position
			if (!this.colliding()) {
				this.x(newX); this.y(newY);
			}

			this.angle(this.angle() + this.turnSpeed() * delta);
		}
	}
);

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

var TTopFlop = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		angle: Trait.required,
		moveSpeed: Trait.required,
		turnSpeed: Trait.required,
		topFlop: getterSetter("topFlop"),
		randomize: function() {
			if (this.colliding()) {
				this.angle(this.angle() + Math.PI * 3 / 4 + 0.5 * Math.random() * Math.PI);
			}
			var seed = Date.now() % 1000000;
			seed = seed * seed;
			this.moveSpeed(0.5);
			this.turnSpeed(Math.sin(seed / 1000));
		}
	}
);

function getDistance(x1, y1, x2, y2) {
	var x = x2 - x1
	, y = y2 - y1;
	return Math.sqrt(x * x + y * y);
}

var TPlayer = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		x: Trait.required,
		y: Trait.required,
		index: getterSetter("index"),
		name: getterSetter("name"),
		points: getterSetter("points", 0),
		collect: function(topsFlops) {
			return topsFlops.filter(
				function(topFlop) {
					return getDistance(this.x(), this.y(), topFlop.x(), topFlop.y()) <= 1;
				},
				this
			).map(
				function(topFlop) {
					var inc = topFlop.topFlop() == "top" ? 1 : -1;
					this.points(this.points() + inc);
					console.log("Player", this.index(), "now has", this.points(), "points");
					return topFlop;
				},
				this
			);
		}
	}
);

// engine object constructors

function makePlayer(state) {
	return Trait.create(
		Object.prototype,
		Trait.compose(makeState(state), TPosition, TPhysics, TWasd, TPlayer)
	);
}

function makeWall(state) {
	return Trait.create(
		Object.prototype,
		Trait.compose(makeState(state), TPosition)
	);
}

function makeTopFlop(state) {
	state.angle = Math.random() * Math.PI * 2;
	return Trait.create(
		Object.prototype,
		Trait.compose(makeState(state), TPosition, TPhysics, TTopFlop)
	);
}

if (typeof exports !== "undefined") {
	exports.makePlayer = makePlayer;
	exports.makeWall = makeWall;
	exports.makeTopFlop = makeTopFlop;
}

