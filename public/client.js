const pollFreq = 50;

let ws = null;
let statusP = null;
let setupForm = null;
let joinButton = null;
let canvas = null;

/**
 * Display a status to the player.
 * @param {String} msg
 */
function status(msg) {
  if (statusP) {
    statusP.textContent = msg;
  }
}

/**
 * Log a message to the console and status panel.
 * @param {String} msg
 */
function log(msg) {
  console.log(msg);
  status(msg);
}

/**
 * Set up UI elements and events.
 */
window.onload = function() {
  statusP = document.getElementById('status');
  setupForm = document.getElementById('setup');
  joinButton = document.getElementById('join');
  canvas = document.getElementById('canvas');

  joinButton.onclick = function() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const name = document.getElementById('name').value;

    joinGame(host, port, name);
  };
};

/**
 * Join a multiplayer Repman game.
 * @param {String} host Host & port where Repman server is running
 * @param {Number} port
 * @param {String} name Name of the player
 */
function joinGame(host, port, name) {
  log('Connecting to ' + host + ':' + port + ' ...');
  ws = new WebSocket('ws://' + host + ':' + port);

  // Send join message to server to identify ourselves with player name
  ws.onopen = function() {
    log('Connection established! Joining as ' + name + ' ...');
    ws.send(JSON.stringify(
        {
          msg: 'join',
          name: name,
        },
    ));
  };

  // React to incoming events from server
  ws.onmessage = function(message) {
    message = JSON.parse(message.data);
    switch (message.msg) {
      case 'joined':
        log('Successfully joined');
        setInterval(sendInput, pollFreq);
        canvas.style.display = 'block';
        setupForm.style.display = 'none';
        break;

      case 'state':
        drawGame(message);
        break;

      default:
        log('Invalid msg');
    }
  };
}

// images

/**
 * Load an image in memory.
 * @param {String} src Path of the image to load
 * @return {Image}
 */
function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const playerImgs = [0, 1, 2, 3].map(
    function(playerIndex) {
      return loadImage('img/player-' + playerIndex + '.png');
    },
);
const wallImg = loadImage('img/wall.png');
const topImg = loadImage('img/top.png');
const flopImg = loadImage('img/flop.png');

// drawing

const tileWidth = 32;

/**
 * Draw the game on screen!
 * @param {Object} state Game state, as it was sent to us from the server.
 */
function drawGame(state) {
  canvas.width = state.width * tileWidth;
  canvas.height = state.height * tileWidth;

  const context = canvas.getContext('2d');

  // fill background
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // draw walls
  state.walls.forEach(
      function(wall) {
        context.drawImage(wallImg, wall.pos.x * tileWidth, wall.pos.y * tileWidth);
      },
  );

  // show player with highest score
  const maxPoints = Math.max.apply(
      {},
      state.players.map(
          function(player) {
            return player.points;
          },
      ),
  );

  // draw players
  state.players.forEach(
      /**
       * Draw a player sprite.
       * @param {Object} player Player state as we received from the server.
       * @param {Number} playerIndex Index of this player, which we use to vary player images.
       */
      function(player, playerIndex) {
        const playerImg = playerImgs[playerIndex % playerImgs.length];
        context.save();
        context.translate(player.pos.x * tileWidth, player.pos.y * tileWidth);

        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.font = player.points == maxPoints ? 'bold 14px Ubuntu' : '12px Ubuntu';
        context.textAlign = 'center';
        context.fillText(player.name + ': ' + (player.points || '0'), 0, -32);

        context.rotate(player.angle);
        context.drawImage(playerImg, -tileWidth / 2, -tileWidth / 2);
        context.restore();
      },
  );

  // draw tops & flops
  state.topsFlops.forEach(
      /**
       * Draw a top or flop bubble.
       * @param {Object} topFlop State as we received from the server.
       */
      function(topFlop) {
        const topFlopImg = topFlop.topFlop == 'top' ? topImg : flopImg;
        context.drawImage(topFlopImg, (topFlop.pos.x - 0.5) * tileWidth, (topFlop.pos.y - 0.5) * tileWidth);
      },
  );

  // show scores
  const scores = state.players.map(
      function(player) {
        return player.name + ': ' + (player.points || '0');
      },
  ).join(', ');
  status(scores + ' (' + Math.round(state.timer) + 's)');
}

// send input

/**
 * Send a message to the server with the state of the WASD keys.
 */
function sendInput() {
  const wasd = {
    w: !!pressed[87],
    a: !!pressed[65],
    s: !!pressed[83],
    d: !!pressed[68],
    msg: 'input',
  };
  ws.send(JSON.stringify(wasd));
}

const pressed = {};

window.onkeydown = function(event) {
  pressed[event.keyCode] = true;
};

window.onkeyup = function(event) {
  delete pressed[event.keyCode];
};
