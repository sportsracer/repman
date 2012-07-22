
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
		moveSpeed: getterSetter("moveSpeed"),
		turnSpeed: getterSetter("turnSpeed"),
		move: function(delta) {
			this.x(this.x() + this.moveSpeed() * Math.cos(this.angle()) * delta);
			this.y(this.y() + this.moveSpeed() * Math.sin(this.angle()) * delta);
			this.angle(this.angle() + this.turnSpeed() * delta);
		}
	}
);

var moveSpeedFactor = 4;
var turnSpeedFactor = Math.PI / 2;

var TWasd = Trait(
	{
		moveSpeed: Trait.required,
		turnSpeed: Trait.required,
		input: function(w, a, s, d) {
			var move = Number(s) - Number(w);
			var turn = Number(d) - Number(a);
			this.moveSpeed(move * moveSpeedFactor);
			this.turnSpeed(turn * turnSpeedFactor);
		}
	}
);

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

if (typeof exports !== "undefined") {
	exports.makePlayer = makePlayer;	
}