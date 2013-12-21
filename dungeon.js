// Some sort of DUNGEON GAME by Steven Frank <stevenf@panic.com>
// With graphical assistance from Neven Mrgan <neven@panic.com>

var WEST = 0;
var EAST = 1;
var NORTH = 2;
var SOUTH = 3;

var maps = new Array();
var textures = new Array();
var dialog = null;
var game = null;

//
// Console
//

Console = function()
{
	this.window = new Window();
	this.window.height = 58;
	this.window.backgroundColor = '#445577';
	this.statusText = "Welcome. Press W, A, S, D keys to move around.";
}

Console.prototype.draw = function(gfx)
{
	this.window.y = gfx.canvasHeight - this.window.height;
	this.window.width = gfx.canvasWidth;
	this.window.x = 0;

	this.window.draw(gfx);

	// Status text

	this.window.drawText(gfx, this.window.strokeWidth * 5, this.window.y + (this.window.strokeWidth * 4) + this.window.fontSize, game.player.name + ' LV:' + game.player.level + ' DL: ' + game.dungeonLevel + ' HP: ' + game.player.hp + '/' + game.player.maxHP + ' XP: ' + game.player.xp + ' G: ' + game.player.gold);
	
	this.window.drawText(gfx, this.window.strokeWidth * 5, this.window.y + (this.window.strokeWidth * 14) + this.window.fontSize, this.statusText);
}

//
// Dialog
//

Dialog = function(message)
{
	this.window = new Window();
	this.window.x = 160;
	this.window.y = 100;
	this.window.width = game.gfx.canvasWidth - (this.window.x * 2);
 	this.window.height = 200;

	this.message = message;
}

Dialog.prototype.draw = function(gfx)
{
	this.window.draw(gfx);
	
	this.window.drawText(gfx, this.window.x + (this.window.strokeWidth * 5), this.window.y + (this.window.strokeWidth * 4) + this.window.fontSize, this.message);
}

Dialog.prototype.handleKeyCode = function(keyCode)
{
	game.dialog = null;
	game.redraw();
}

//
// Gfx
//

Gfx = function()
{
	this.clearColor = 'black';

	this.canvas = document.getElementById('canvas');
	this.context = canvas.getContext('2d');
	
	this.canvasWidth = canvas.width;
	this.canvasHeight = canvas.height;
	
	this.clear();
	
	console.log('canvas: ' + this.canvasWidth + ' x ' + this.canvasHeight);
}

Gfx.prototype.clear = function()
{
	this.fillRect(0, 0, this.canvasWidth, this.canvasHeight, this.clearColor);
}

Gfx.prototype.drawTexture = function(textureName, x, y)
{
	this.context.drawImage(textures[textureName].image, x, y);
}
		
Gfx.prototype.fillRect = function(x, y, w, h, fillStyle)
{
	this.context.fillStyle = fillStyle;
	this.context.fillRect(x, y, w, h);
}

Gfx.prototype.fillText = function(x, y, text, fillStyle, font)
{				
	this.context.fillStyle = fillStyle;
	this.context.font = font;
	this.context.fillText(text, x, y);
}

Gfx.prototype.strokeRect = function(x, y, w, h, strokeStyle, lineWidth)
{
	this.context.strokeStyle = strokeStyle;
	this.context.lineWidth = lineWidth;
	this.context.strokeRect(x, y, w, h);
}

//
// Player
//

Player = function(tileMap)
{
	this.level = 1;
	this.hp = 10;
	this.maxHP = 10;
	this.xp = 0;
	this.gold = 0;
	this.inventory = new Array();
	this.name = 'Player';
	this.textureName = 'hero-1';
	this.tileMap = tileMap;
	this.tileX = Math.floor(tileMap.mapSize / 2);
	this.tileY = Math.floor(tileMap.mapSize / 2);
}

Player.prototype.draw = function(gfx)
{
	var screenTileWidth = Math.floor(gfx.canvasWidth / this.tileMap.tileSize);
	var screenTileHeight = Math.floor(gfx.canvasHeight / this.tileMap.tileSize);
	var tx = this.tileX - this.tileMap.mapOffsetTileX + Math.floor(screenTileWidth / 2);
	var ty = this.tileY - this.tileMap.mapOffsetTileY + Math.floor(screenTileHeight / 2);

	gfx.drawTexture(this.textureName, tx * this.tileMap.tileSize, ty * this.tileMap.tileSize);
}

Player.prototype.move = function(heading, tileMap)
{
	var moved = false;
	
	if ( heading == NORTH )
	{
		if ( this.tileY > 0 )
		{
			var nTile = tileMap.map[this.tileX][this.tileY - 1];
			
			if ( nTile.passable == true )
			{
				--this.tileY;
				moved = true;
			}
		}
	}
	else if ( heading == EAST )
	{
		if ( this.tileX < tileMap.mapSize )
		{
			var eTile = tileMap.map[this.tileX + 1][this.tileY];
			
			if ( eTile.passable == true )
			{
				++this.tileX;
				moved = true;
			}
		}
	}
	else if ( heading == WEST )
	{
		if ( this.tileX > 0 )
		{
			var wTile = tileMap.map[this.tileX - 1][this.tileY];
			
			if ( wTile.passable == true )
			{
				--this.tileX;
				moved = true;
			}
		}
	}
	else if ( heading == SOUTH )
	{
		if ( this.tileY < tileMap.mapSize )
		{
			var sTile = tileMap.map[this.tileX][this.tileY + 1];
			
			if ( sTile.passable == true )
			{
				++this.tileY;
				moved = true;
			}
		}
	}
	
	if ( moved )
	{
		var onTile = tileMap.map[this.tileX][this.tileY];
		var onTileID = onTile.id;
		
		if ( onTileID == tileMap.tileTypes.stairsDown.id )
		{
			game.console.statusText = 'There are stairs leading down here. Press > to descend.';
		}
		else if ( onTileID == tileMap.tileTypes.stairsUp.id )
		{
			game.console.statusText = 'There are stairs leading up here. Press < to ascend.';
		}
		else
		{
			if ( onTile.itemName != null )
			{
				game.console.statusText = 'There is ' + onTile.itemName + ' here. Press T to take.';
			}
		}
	}
	
	return moved;
}

//
// Texture
//

Texture = function(name, callback)
{
	this.loaded = false;
	this.image = new Image();
	this.image.onload = callback;
	this.image.src = 'textures/' + name + '.png';
	textures[name] = this;
}

//
// TileMap
//

TileMap = function()
{
	this.mapSize = 100;
	this.tileSize = 32;
	this.tileTypes = 
	{
		none: 
		{
			id: 0,
			color: '#383c22',
			passable: false,
			textureName: '',
		},
		
		floor: 
		{
			id: 1,
			passable: true,
			textureName: 'floor-1',
		},
		
		healthPotion:
		{
			id: 2,
			passable: true,
			textureName: 'potion-red',
			itemName: 'a health potion',
		},
		
		stairsDown: 
		{
			id: 3,
			passable: true,
			textureName: 'stairs-down',
		},

		stairsUp: 
		{
			id: 4,
			passable: true,
			textureName: 'stairs-up',
		},
		
		wall: 
		{
			id: 5,	
			passable: false,
			textureName: 'wall-1',
		},
	};

	this.generateMap();
}

TileMap.prototype.digRoom = function(cx, cy, width, height)
{
	// Calculate the edge coordinates

	var left = cx - Math.floor(width / 2);
	var top = cy - Math.floor(height / 2);
	var right = left + width - 1;
	var bottom = top + height - 1;
		
	// Set the whole rectangle to floor tiles
	
	for ( var y = top + 1; y <= bottom - 1; ++y )
	{
		for ( var x = left + 1; x <= right - 1; ++x )
		{
			this.map[x][y] = this.tileTypes.floor;
		}
	}			
}

TileMap.prototype.draw = function(gfx)
{
	var screenTileWidth = Math.floor(gfx.canvasWidth / this.tileSize);
	var screenTileHeight = Math.floor(gfx.canvasHeight / this.tileSize);
	var screenTileX = 0;
	var screenTileY = 0;
	var startX = Math.floor(this.mapOffsetTileX - (screenTileWidth / 2));
	var startY = Math.floor(this.mapOffsetTileY - (screenTileHeight / 2));
	
	for ( var y = startY; y < startY + screenTileHeight; ++y )
	{
		for ( var x = startX; x < startX + screenTileWidth; ++x )
		{
			if ( x >= 0 && y >= 0 && x < this.mapSize && y < this.mapSize )
			{
				var tile = this.map[x][y];
				this.drawTile(gfx, tile, screenTileX, screenTileY);
			}
			else
			{
				// Outside map bounds
				
				this.drawTile(gfx, null, screenTileX, screenTileY);
			}
			
			++screenTileX;
		}
		
		screenTileX = 0;
		++screenTileY;
	}
}

TileMap.prototype.drawTile = function(gfx, tile, screenTileX, screenTileY)
{			
	var color = '#222222';
	var textureName = '';
	
	if ( tile != null )
	{
		color = tile.color;
		textureName = tile.textureName;
	}
	
	if ( textureName != '' )
	{
		gfx.drawTexture(textureName, screenTileX * this.tileSize, screenTileY * this.tileSize);
	}
	else
	{
		gfx.fillRect(screenTileX * this.tileSize, screenTileY * this.tileSize, this.tileSize, this.tileSize, color);
	}
}

TileMap.prototype.generateMap = function()
{
	// The basic algorithm here is to plop down a certain number of 
	// rectangular "rooms" into an empty map.  As each room is created,
	// a randomly wandering corridor is drawn connecting the center 
	// point of the last room to the center point of the new room.
	//
	// Then we do a sweep across the whole map, placing wall tiles
	// on any vacant tile that's adjacent to a floor tile, to 
	// enclose the rooms and corridors. Lastly, any wall tiles that 
	// ended up in the middle of a room are removed.

	if ( maps[game.dungeonLevel] )
	{
		this.map = maps[game.dungeonLevel];
		return;
	}

	// Initialize map as two-dimensional array of empty objects

	this.map = new Array(this.mapSize);	
	
	for ( var i = 0; i < this.mapSize; ++i )
	{
		this.map[i] = new Array(this.mapSize);

		for ( var j = 0; j < this.mapSize; ++j )
		{
			this.map[i][j] = this.tileTypes.none;
		}
	}			
	
	// Center map in view
	
	this.mapOffsetTileX = Math.floor(this.mapSize / 2);
	this.mapOffsetTileY = Math.floor(this.mapSize / 2);
	
	// Some convenience variables to hold tileMap metrics

	var width = this.mapSize;
	var height = this.mapSize;

	var minRoomHeight = 3;
	var minRoomWidth = 3;
	var maxRoomHeight = 16;
	var maxRoomWidth = 16;
	
	var roomsToDig = 14;

	// Inset rooms by at least 1 pixel from the edge of the map so walls 
	// can always be built around them

	var minX = 1;
	var maxX = width - 2;
	var minY = 1;
	var maxY = width - 2;

	// Dig out the first room, which is always in the center of the map

	var centerX = Math.floor(width / 2);
	var centerY = Math.floor(height / 2);
	var roomWidth = randomIntBetween(minRoomWidth, maxRoomWidth);
	var roomHeight = randomIntBetween(minRoomHeight, maxRoomHeight);

	this.digRoom(centerX, centerY, roomWidth, roomHeight);

	var lastCenterX = centerX;
	var lastCenterY = centerY;

	// Dig out more rooms
		
	for ( var i = 0; i < roomsToDig; ++ i )
	{
		// Randomly pick a room size and calculate its center point

		roomWidth = randomIntBetween(minRoomWidth, maxRoomWidth);
		roomHeight = randomIntBetween(minRoomHeight, maxRoomHeight);
		centerX = randomIntBetween(minX + roomWidth, maxX - roomWidth);
		centerY = randomIntBetween(minY + roomHeight, maxY - roomHeight);
		
		this.digRoom(centerX, centerY, roomWidth, roomHeight);
	
		// Dig a corridor from the center of the last room to the center of this one
		
		var corrX = lastCenterX;
		var corrY = lastCenterY;
		
		var runLength = 0;
		var heading;
		
		while ( !(corrX == centerX && corrY == centerY) )
		{
			// To keep the corridors from always being L-shaped, dig short runs of
			// corridor, randomly alternating between vertical and horizontal
			// movement until arriving
			
			if ( runLength == 0 )
			{
				// Reached end of run. Flip a coin to see if next run will be
				// vertical or horizontal (but always heading towards the end point)

				if ( randomIntBetween(0, 1) == 1 )
				{
					if ( corrX > centerX )
						heading = WEST;
					else
						heading = EAST;
				}
				else
				{
					if ( corrY > centerY )
						heading = NORTH;
					else
						heading = SOUTH;
				}
				
				runLength = randomIntBetween(1, 3);
			}

			// If not at destination point, keep digging in current heading
			
			if ( heading == EAST && corrX < centerX )
			{
				this.digRoom(corrX, corrY, 3, 3);
				++corrX;
			}
			
			if ( heading == WEST && corrX > centerX )
			{
				this.digRoom(corrX, corrY, 3, 3);
				--corrX;
			}
			
			if ( heading == SOUTH && corrY < centerY )
			{
				this.digRoom(corrX, corrY, 3, 3);
				++corrY;
			}
			
			if ( heading == NORTH && corrY > centerY )
			{
				this.digRoom(corrX, corrY, 3, 3);
				--corrY;
			}
			
			--runLength;
		}
		
		lastCenterX = centerX;
		lastCenterY = centerY;
	}

	// Put walls on any empty tiles that are next to a floor tile
	
	for ( var y = 1; y < height - 1; ++y )
	{
		for ( var x = 1; x < width - 1; ++x )
		{
			if ( this.map[x][y].id == this.tileTypes.none.id )
			{	
				var nTypeID = this.map[x][y - 1].id;
				var eTypeID = this.map[x + 1][y].id;
				var sTypeID = this.map[x][y + 1].id;
				var wTypeID = this.map[x - 1][y].id;
				var neTypeID = this.map[x + 1][y - 1].id;
				var nwTypeID = this.map[x - 1][y - 1].id;
				var seTypeID = this.map[x + 1][y + 1].id;
				var swTypeID = this.map[x - 1][y + 1].id;

				if ( nTypeID == this.tileTypes.floor.id || sTypeID == this.tileTypes.floor.id
						|| eTypeID == this.tileTypes.floor.id || wTypeID == this.tileTypes.floor.id
						|| nwTypeID == this.tileTypes.floor.id || neTypeID == this.tileTypes.floor.id
						|| swTypeID == this.tileTypes.floor.id || seTypeID == this.tileTypes.floor.id )
				{
					this.map[x][y] = this.tileTypes.wall;
				}
			}
		}
	}

	// Remove freestanding "interior" walls by setting any tile completely surrounded
	// by (wall or floor) to floor.  Do two passes of this, otherwise some get left behind.
	// I haven't stopped to figure out why yet.

	for ( var i = 0; i < 2; ++ i )
	{
		for ( var y = 1; y < height - 1; ++y )
		{
			for ( var x = 1; x < width - 1; ++x )
			{
				var nTypeID = this.map[x][y - 1].id;
				var eTypeID = this.map[x + 1][y].id;
				var sTypeID = this.map[x][y + 1].id;
				var wTypeID = this.map[x - 1][y].id;
				var neTypeID = this.map[x + 1][y - 1].id;
				var nwTypeID = this.map[x - 1][y - 1].id;
				var seTypeID = this.map[x + 1][y + 1].id;
				var swTypeID = this.map[x - 1][y + 1].id;
				
				if ( (nTypeID == this.tileTypes.wall.id || nTypeID == this.tileTypes.floor.id)
						&& (eTypeID == this.tileTypes.wall.id || eTypeID == this.tileTypes.floor.id)
						&& (sTypeID == this.tileTypes.wall.id || sTypeID == this.tileTypes.floor.id)
						&& (wTypeID == this.tileTypes.wall.id || wTypeID == this.tileTypes.floor.id)
						&& (nwTypeID == this.tileTypes.wall.id || nwTypeID == this.tileTypes.floor.id)
						&& (neTypeID == this.tileTypes.wall.id || neTypeID == this.tileTypes.floor.id)
						&& (swTypeID == this.tileTypes.wall.id || swTypeID == this.tileTypes.floor.id)
						&& (seTypeID == this.tileTypes.wall.id || seTypeID == this.tileTypes.floor.id) )
				{
					this.map[x][y] = this.tileTypes.floor;
				}
			}
		}
	}
	
	// Place a staircase down 
	
	centerX = Math.floor(width / 2);
	centerY = Math.floor(height / 2);

	this.randomlyPlace(this.tileTypes.stairsDown);
	
	// Unless this is level 1, put stairs leading back up
	
	if ( game.dungeonLevel > 1 )
	{
		this.map[centerX][centerY] = this.tileTypes.stairsUp;
	}
	
	// Drop some potions
	
	var maxPotions = 2;
	
	for ( var i = 0; i < maxPotions; ++i )
	{
		this.randomlyPlace(this.tileTypes.healthPotion);
	}
	
	// Save map
	
	if ( maps[game.dungeonLevel] == null )
	{
		maps[game.dungeonLevel] = this.map;
	}
}

TileMap.prototype.randomlyPlace = function(tile)
{
	var width = this.mapSize;
	var height = this.mapSize;
	var centerX = Math.floor(width / 2);
	var centerY = Math.floor(height / 2);

	while ( true )
	{
		var x = randomIntBetween(0, this.mapSize - 1);
		var y = randomIntBetween(0, this.mapSize - 1);
		
		if ( this.map[x][y].id == this.tileTypes.floor.id && !(x == centerX && y == centerY) )
		{
			this.map[x][y] = tile;
			break;
		}	
	}
}

//
// Window
//

Window = function()
{
	this.backgroundColor = '#2266aa';
	this.font = 'Menlo, Courier, monospace';
	this.fontSize = 16;
	this.height = 16 * 4;
	this.strokeColor = '#ffffff';
	this.strokeWidth = 2;
	this.textColor = '#eeeeff';

	this.x = 160;
	this.y = 100;
 	this.height = 200;
}

Window.prototype.draw = function(gfx)
{
	this.width = gfx.canvasWidth - (this.x * 2);

	// Background fill

	gfx.fillRect(this.x, this.y, this.width, this.height, this.backgroundColor);
	
	// Outline stroke
	
	gfx.strokeRect(this.x + (this.strokeWidth * 2), this.y + (this.strokeWidth * 2), this.width - (this.strokeWidth * 4), this.height - (this.strokeWidth * 4), this.strokeColor, this.strokeWidth);
}

Window.prototype.drawText = function(gfx, x, y, text)
{
	gfx.fillText(x, y, text, this.textColor, this.fontSize + 'px ' + this.font);
}

//
// Utilities
//

randomIntBetween = function(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;				
}

//
// Game
//

Game = function()
{
}

Game.prototype.init = function()
{
	this.dungeonLevel = 1;

	this.tileMap = new TileMap();
	this.gfx = new Gfx();
	this.console = new Console();
	this.player = new Player(this.tileMap);
	
	this.redraw();
	
	document.addEventListener('keypress', function(event)
	{
		game.console.statusText = '';

		var keyCode = event.keyCode;
		
		if ( game.dialog )
		{
			game.dialog.handleKeyCode(keyCode);
		}
		else
		{		
			if ( keyCode == 119 || keyCode == 87 /* W */ )
			{
				game.moveNorth();
			}
			else if ( keyCode == 115 || keyCode == 83 /* S */ )
			{
				game.moveSouth();
			}
			else if ( keyCode == 97 || keyCode == 65 /* A */ )
			{
				game.moveWest();
			}
			else if ( keyCode == 100 || keyCode == 68 /* D */ )
			{
				game.moveEast();
			}
			else if ( keyCode == 60 /* < */ )
			{
				game.ascendStairs();
			}
			else if ( keyCode == 62 /* > */ )
			{
				game.descendStairs();
			}
			else if ( keyCode == 63 /* ? */ )
			{
				game.showHelp();
			}
			else if ( keyCode == 105 || keyCode == 73 /* I */ )
			{
				game.showInventory();
			}
			else if ( keyCode == 116 || keyCode == 84 /* T */ )
			{
				game.take();
			}
			else
			{
				console.log('unhandled keyCode: ' + keyCode);
			}
	
			if ( game.needsRedraw )
			{	
				event.preventDefault();
				game.redraw();			
				game.needsRedraw = false;
			}
		}
	}, true);
}

Game.prototype.ascendStairs = function()
{
	if ( this.tileMap.map[this.player.tileX][this.player.tileY].id == this.tileMap.tileTypes.stairsUp.id )
	{
		--this.dungeonLevel;
		this.tileMap.generateMap();
		
		this.placePlayerAtTileWithID(this.tileMap.tileTypes.stairsDown.id);
		
		this.console.statusText = 'You ascend to dungeon level ' + this.dungeonLevel + '.';
	}
	else
	{
		this.console.statusText = 'There are no stairs up here.';
	}

	this.needsRedraw = true;
}

Game.prototype.descendStairs = function()
{
	if ( this.tileMap.map[this.player.tileX][this.player.tileY].id == this.tileMap.tileTypes.stairsDown.id )
	{
		++this.dungeonLevel;
		this.tileMap.generateMap();
		
		this.placePlayerAtTileWithID(this.tileMap.tileTypes.stairsUp.id);		
		
		this.console.statusText = 'You descend to dungeon level ' + this.dungeonLevel + '.';
	}
	else
	{
		this.console.statusText = 'There are no stairs down here.';
	}

	this.needsRedraw = true;
}

Game.prototype.moveEast = function()
{
	if ( this.player.move(EAST, this.tileMap) )
	{
		++this.tileMap.mapOffsetTileX;
	}
	else
	{
		this.console.statusText = 'You walk into the wall. Ouch.';
	}

	this.needsRedraw = true;				
}

Game.prototype.moveNorth = function()
{
	if ( this.player.move(NORTH, this.tileMap) )
	{
		--this.tileMap.mapOffsetTileY;
	}
	else
	{
		this.console.statusText = 'You walk into the wall. Ouch.';
	}

	this.needsRedraw = true;				
}

Game.prototype.moveSouth = function()
{
	if ( this.player.move(SOUTH, this.tileMap) )
	{
		++this.tileMap.mapOffsetTileY;
	}
	else
	{
		this.console.statusText = 'You walk into the wall. Ouch.';
	}

	this.needsRedraw = true;				
}

Game.prototype.moveWest = function()
{
	if ( this.player.move(WEST, this.tileMap) )
	{
		--this.tileMap.mapOffsetTileX;
	}
	else
	{
		this.console.statusText = 'You walk into the wall. Ouch.';
	}

	this.needsRedraw = true;
}

Game.prototype.placePlayerAtTileWithID = function(id)
{
	var foundTile = false;
	
	for ( var x = 0; x < this.tileMap.mapSize; ++x )
	{
		for ( var y = 0; y < this.tileMap.mapSize; ++y )
		{
			if ( this.tileMap.map[x][y].id == id )
			{
				this.player.tileX = x;
				this.player.tileY = y;

				this.tileMap.mapOffsetTileX = x;
				this.tileMap.mapOffsetTileY = y;
				
				foundTile = true;
				break;
			}				
		}

		if ( foundTile )
		{
			break;
		}
	}		
}

Game.prototype.redraw = function()
{
	this.gfx.clear();
	
	this.tileMap.draw(this.gfx);
	this.player.draw(this.gfx);
	this.console.draw(this.gfx);
	
	if ( this.dialog )
	{
		this.dialog.draw(this.gfx);
	}
}

Game.prototype.showHelp = function()
{
	game.dialog = new Dialog('Help');
	game.needsRedraw = true;
}

Game.prototype.showInventory = function()
{
	game.dialog = new Dialog('Inventory');
	game.needsRedraw = true;
}

Game.prototype.take = function()
{
	var onTile = this.tileMap.map[this.player.tileX][this.player.tileY];
	var onTileID = onTile.id;

	if ( onTileID != this.tileMap.tileTypes.floor.id )
	{
		this.tileMap.map[this.player.tileX][this.player.tileY] = this.tileMap.tileTypes.floor;
		this.console.statusText = 'You take ' + onTile.itemName + '.';
	}
	else
	{
		this.console.statusText = 'There is nothing to take here.';
	}

	this.needsRedraw = true;
}

init = function()
{
	var texturesToLoad = 
	[
		'floor-1',
		'hero-1',
		'potion-red',
		'stairs-down',
		'stairs-up',
		'wall-1',
	];
	
	var texturesLoaded = 0;
	
	for ( var i = 0; i < texturesToLoad.length; ++i )
	{
		console.log('loading ' + texturesToLoad[i] + '...'); 

		new Texture(texturesToLoad[i], function() 
		{ 			
			++texturesLoaded;
			
			if ( texturesLoaded == texturesToLoad.length )
			{
				console.log('all textures loaded');
				game = new Game();
				game.init();
			}
		});
	}
}
