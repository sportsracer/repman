
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

var TPosition = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		x: getterSetter("x"),
		y: getterSetter("y")
	}
);

var TPhysics = Trait(
	{
		get: Trait.required,
		set: Trait.required,
		angle: getterSetter("angle"),
		speed: getterSetter("speed"),
		move: function(delta) {
			this.x(this.x() + this.speed() * Math.cos(this.angle()) * delta);
			this.y(this.y() + this.speed() * Math.sin(this.angle()) * delta);
		}
	}
);

var moveSpeed = 10;
var turnSpeed = Math.PI;

var TWasd = Trait(
	{
		angle: Trait.required,
		speed: Trait.required,
		input: function(delta, w, a, s, d) {
			var move = Number(w) - Number(s);
			var turn = Number(a) - Number(d);
			this.angle(turn * turnSpeed * delta);
			this.speed(move * moveSpeed * delta);
			console.log("angle:", this.angle(), "speed:", this.speed());
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