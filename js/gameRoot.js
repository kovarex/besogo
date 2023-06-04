besogo.makeGameRoot = function(sizeX, sizeY)
{
  'use strict';
  var BLACK = -1, // Stone state constants
      WHITE = 1, // Equal to -BLACK
      EMPTY = 0, // Any falsy (e.g., undefined) value is also empty

      root = { // Inherited attributes of root node
          blackCaps: 0,
          whiteCaps: 0,
          moveNumber: 0
      };

  // Initializes non-inherited attributes
  function initNode(node, parent) {
      node.parent = parent;
      node.board = parent ? Object.create(parent.board) : [];
      node.children = [];
      node.virtualChildren = [];

      node.move = null;
      node.setupStones = [];
      node.virtualParents = [];
      node.markup = [];
      node.comment = ''; // Comment on this node
      node.hash = 0;
      node.correctSource = false;
      node.correct = false;
      node.cameFrom = null;
      node.statusSource = null;
      node.status = null;
  }
  initNode(root, null); // Initialize root node with null parent
  root.relevantMoves = [];
  root.nodeHashTable = besogo.makeNodeHashTable();

  // Plays a move, returns true if successful
  // Set allow to truthy to allow overwrite, suicide and ko
  root.playMove = function(x, y, color = false, allow = false)
  {
    var captures = 0, // Number of captures made by this move
        overwrite = false, // Flags whether move overwrites a stone
        prevMove; // Previous move for ko check

    if (!this.isMutable('move'))
      return false; // Move fails if node is immutable

    if (!color) // Falsy color indicates auto-color
      color = this.nextMove();

    if (x < 1 || y < 1 || x > sizeX || y > sizeY)
    {
      // Register as pass move if out of bounds
      this.move =
      {
        x: 0, y: 0, // Log pass as position (0, 0)
        color: color,
        captures: 0, // Pass never captures
        overwrite: false // Pass is never an overwrite
      };
      this.lastMove = color; // Store color of last move
      this.moveNumber++; // Increment move number
      return true; // Pass move successful
    }

    var previousColor = this.getStone(x, y);

    if (previousColor)  // Check for overwrite
    {
      if (!allow)
        return false; // Reject overwrite move if not allowed
      overwrite = true; // Otherwise, flag overwrite and proceed
    }

    var pending = []; // Initialize pending capture array
    var suicidePending = [];

    this.setStone(x, y, color); // Place the move stone

    // Check for captures of surrounding chains
    captureStones(this, x - 1, y, color, pending);
    captureStones(this, x + 1, y, color, pending);
    captureStones(this, x, y - 1, color, pending);
    captureStones(this, x, y + 1, color, pending);

    captures = pending.length; // Capture count

    prevMove = this.parent ? this.parent.move : null; // Previous move played
    if (!allow && prevMove && // If previous move exists, ...
        prevMove.color === -color && // was of the opposite color, ...
        prevMove.overwrite === false && // not an overwrite, ...
        prevMove.captures === 1 && // captured exactly one stone, and if ...
        captures === 1 && // this move captured exactly one stone at the location ...
        !this.getStone(prevMove.x, prevMove.y)) //of the previous move
    {
      this.setStone(x, y, previousColor);
      for (let i = 0; i < pending.length; ++i)
        this.setStone(pending[i].x, pending[i].y, -color);
      return false; // Reject ko move if not allowed
    }

    if (captures === 0)  // Check for suicide if nothing was captured
    {
      captureStones(this, x, y, -color, suicidePending); // Invert color for suicide check
      captures = -suicidePending.length; // Count suicide as negative captures
      if (captures < 0 && !allow)
      {
        this.setStone(x, y, previousColor);
        for (let i = 0; i < pending.length; ++i)
          this.setStone(pending[i].x, pending[i].y, -color);
        for (let i = 0; i < suicidePending.length; ++i)
          this.setStone(suicidePending[i].x, suicidePending[i].y, color);
        return false; // Reject suicidal move if not allowed
      }
    }

    if (color * captures < 0) // Capture by black or suicide by white
      this.blackCaps += Math.abs(captures); // Tally captures for black
    else // Capture by white or suicide by black
      this.whiteCaps += Math.abs(captures); // Tally captures for white

    // Log the move
    this.move =
    {
      x: x, y: y,
      color: color,
      captures: captures,
      overwrite: overwrite
    };
    this.lastMove = color; // Store color of last move
    this.moveNumber++; // Increment move number
    return true;
  };

  // Check for and perform capture of opposite color chain at (x, y)
  function captureStones(board, x, y, color, captures)
  {
    var pending = [];

    // Captured chain found
    if (!recursiveCapture(board, x, y, color, pending))
      for (let i = 0; i < pending.length; i++)  // Remove captured stones
      {
        board.setStone(pending[i].x, pending[i].y, EMPTY);
        captures.push(pending[i]);
      }
  }

  // Recursively builds a chain of pending captures starting from (x, y)
  // Stops and returns true if chain has liberties
  function recursiveCapture(board, x, y, color, pending)
  {
    if (x < 1 || y < 1 || x > sizeX || y > sizeY)
      return false; // Stop if out of bounds
    if (board.getStone(x, y) === color)
      return false; // Stop if other color found
    if (!board.getStone(x, y))
      return true; // Stop and signal that liberty was found
    for (let i = 0; i < pending.length; i++)
      if (pending[i].x === x && pending[i].y === y)
        return false; // Stop if already in pending captures

    pending.push({ x: x, y: y }); // Add new stone into chain of pending captures

    // Recursively check for liberties and expand chain
    if (recursiveCapture(board, x - 1, y, color, pending) ||
        recursiveCapture(board, x + 1, y, color, pending) ||
        recursiveCapture(board, x, y - 1, color, pending) ||
        recursiveCapture(board, x, y + 1, color, pending))
      return true; // Stop and signal liberty found in subchain
    return false; // Otherwise, no liberties found
  }

  // Get next to move
  root.nextMove = function()
  {
    if (this.lastMove) // If a move has been played
      return -this.lastMove; // Then next is opposite of last move
    else
      return BLACK; // otherwise, black plays first
  };

  root.nextIsBlack = function() { return this.nextMove() == BLACK; }

  // Places a setup stone, returns true if successful
  root.placeSetup = function(x, y, color)
  {
      let prevColor = (this.parent && this.parent.getStone(x, y)) || EMPTY;

      if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
          return false; // Do not allow out of bounds setup
      }
      if (!this.isMutable('setup') || this.getStone(x, y) === color) {
          // Prevent setup changes in immutable node or quit early if no change
          return false;
      }

      this.setStone(x, y, color); // Place the setup stone
      this.setupStones[this.fromXY(x, y) ] = color - prevColor; // Record the necessary change
      return true;
  };

  // Adds markup, returns true if successful
  root.addMarkup = function(x, y, mark)
  {
    if (x < 1 || y < 1 || x > sizeX || y > sizeY)
      return false; // Do not allow out of bounds markup
    if (this.getMarkup(x, y) === mark) // Quit early if no change to make
      return false;
    this.markup[this.fromXY(x, y)] = mark;
    return true;
  };

  root.getStone = function(x, y) { return this.board[x + '-' + y] || EMPTY; };
  root.setStone = function(x, y, color) { this.board[x + '-' + y] = color; }

  // Gets the setup stone placed at (x, y), returns false if none
  root.getSetup = function(x, y)
  {
      if (!this.setupStones[this.fromXY(x, y)]) // No setup stone placed
        return false;
      else // Determine net effect of setup stone
        switch(this.getStone(x, y))
        {
          case EMPTY: return 'AE';
          case BLACK: return 'AB';
          case WHITE: return 'AW';
        }
  };

  // Gets the markup at (x, y)
  root.getMarkup = function(x, y)
  {
    return this.markup[this.fromXY(x, y)] || EMPTY;
  };

  // Determines the type of this node
  root.getType = function()
  {
    if (this.move) // Logged move implies move node
      return 'move';

    for (let i = 0; i < this.setupStones.length; i++)
      if (this.setupStones[i]) // Any setup stones implies setup node
        return 'setup';

    return 'empty'; // Otherwise, "empty" (neither move nor setup)
  };

  root.getCorrectColor = function()
  {
    if (this.correct)
      return 'green';
    return 'red';
  };

  // Checks if this node can be modified by a 'type' action
  root.isMutable = function(type)
  {
    // Can only add a move to an empty node with no children
    if (type === 'move' && this.getType() === 'empty' && this.children.length === 0)
      return true;

    // Can only add setup stones to a non-move node (children are allowed to be able to edit existing problem)
    if (type === 'setup' && this.getType() !== 'move')
      return true;
    return false;
  };

  // Gets siblings of this node
  root.getSiblings = function()
  {
    return (this.parent && this.parent.children) || [];
  };

  // Makes a child node of this node, but does NOT add it to children
  root.makeChild = function()
  {
    var child = Object.create(this); // Child inherits properties
    initNode(child, this); // Initialize other properties

    return child;
  };

  // Adds a child to this node
  root.addChild = function(child)
  {
    this.children.push(child);
    this.correct = false;
    this.correctSource = false;
  };

  // Remove child node from this node, returning false if failed
  root.removeChild = function(child)
  {
    let i = this.children.indexOf(child);
    if (i == -1)
      return false;
    this.children.splice(i, 1);
    return true;
  };

  root.removeVirtualParent = function(virtualParent)
  {
    let i = this.virtualParents.indexOf(virtualParent);
    if (i == -1)
      return false;
    this.virtualParents.splice(i, 1);
    return true;
  };

  root.destroy = function(root = this.getRoot(), removeFromParent = true)
  {
    for (let i = 0; i < this.children.length; ++i)
      this.children[i].destroy(root, false);
    this.children = [];

    for (let i = 0; i < this.virtualParents.length; ++i)
      this.virtualParents[i].removeVirtualChild(this);
    this.virtualParents = [];

    for (let i = 0; i < this.virtualChildren.length; ++i)
      this.virtualChildren[i].target.removeVirtualParent(this);
    this.virtualChildren = [];
    root.nodeHashTable.erase(this);

    if (removeFromParent)
      this.parent.removeChild(this);
  };

  root.removeVirtualChild = function(child)
  {
    for (let i = 0; i < this.virtualChildren.length; ++i)
    {
      var node = this.virtualChildren[i];
      if (node.target == child)
      {
        this.virtualChildren.splice(i, 1);
        return true;
      }
    }
    return false;
  };

  root.getMoveToGetToVirtualChild = function(child)
  {
    for (let i = 0; i < this.virtualChildren.length; ++i)
      if (this.virtualChildren[i].target == child)
        return this.virtualChildren[i].move;
    return null;
  }

  // Raises child variation to a higher precedence
  root.promote = function(child)
  {
    var i = this.children.indexOf(child);
    if (i > 0) // Child exists and not already first
    {
      this.children[i] = this.children[i - 1];
      this.children[i - 1] = child;
      return true;
    }
    return false;
  };

  // Drops child variation to a lower precedence
  root.demote = function(child)
  {
    var i = this.children.indexOf(child);
    if (i !== -1 && i < this.children.length - 1) // Child exists and not already last
    {
      this.children[i] = this.children[i + 1];
      this.children[i + 1] = child;
      return true;
    }
    return false;
  };

  // Gets board size
  root.getSize = function() { return {x: sizeX, y: sizeY}; };

  // Convert (x, y) coordinates to linear index
  root.fromXY = function(x, y)
  {
    return (x - 1) * sizeY + (y - 1);
  }

  root.toXY = function(value)
  {
    var result = [];
    result.y = value % sizeY + 1;
    result.x = Math.floor(value/sizeY) + 1;
    return result;
  }

  root.getHash = function()
  {
    if (this.hash)
      return this.hash;
    return this.updateHash();
  }

  function hashCode(str)
  {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++)
    {
      let chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  root.updateHash = function()
  {
    this.hash = 1;
    for (var key in this.board)
      this.hash += hashCode(key) * this.board[key];
    return this.hash
  }

  function keyCount(a)
  {
    var i = 0;
    for (var key in a) ++i;
    return i;
  }

  function compareAssociativeArrays(a, b)
  {
    if (keyCount(a) != keyCount(b))
      return false;
    for (var key in a)
      if (a[key] != b[key])
        return false;
     return true;
  }

  root.getForbiddenMoveBecauseOfKo = function()
  {
    if (!this.move)
      return null;
    if (this.move.captures != 1)
      return null;
    let whiteSurrounds = 0;
    let emptySpace = null;
    if (this.move.x > 1)
    {
      let stone = this.getStone(this.move.x - 1, this.move.y);
      if (stone == -this.move.color)
        ++whiteSurrounds;
      else if (stone == 0)
        emptySpace = {x: this.move.x - 1, y: this.move.y};
    }
    else
      ++whiteSurrounds;

    if (this.move.x < sizeX)
    {
      let stone = this.getStone(this.move.x + 1, this.move.y);
      if (stone == -this.move.color)
        ++whiteSurrounds;
      else if (stone == 0)
        emptySpace = {x: this.move.x + 1, y: this.move.y};
    }
    else
      ++whiteSurrounds;

    if (this.move.y > 1)
    {
      let stone = this.getStone(this.move.x, this.move.y - 1);
      if (stone == -this.move.color)
        ++whiteSurrounds;
      else if (stone == 0)
        emptySpace = {x: this.move.x, y: this.move.y - 1};
    }
    else
      ++whiteSurrounds;

    if (this.move.y < sizeY)
    {
      let stone = this.getStone(this.move.x, this.move.y + 1);
      if (stone == -this.move.color)
        ++whiteSurrounds;
      else if (stone == 0)
        emptySpace = {x: this.move.x, y: this.move.y + 1};
    }
    else
      ++whiteSurrounds;

    if (whiteSurrounds != 3)
      return null;
    return emptySpace;
  }

  root.hasSameKoStateAs = function(other)
  {
    let thisKo = this.getForbiddenMoveBecauseOfKo(this.move);
    let otherKo = other.getForbiddenMoveBecauseOfKo(other.move);
    if (!thisKo && !otherKo)
      return true;
    if (!thisKo && otherKo)
      return false;
    if (thisKo && !otherKo)
      return false;
    return thisKo.x == otherKo.x || thisKo.y == otherKo.y;
  }

  root.samePositionAs = function(other)
  {
    if (this.nextIsBlack() != other.nextIsBlack())
      return false;
    if (!compareAssociativeArrays(this.board, other.board))
      return false;
    return this.hasSameKoStateAs(other);
  }

  root.treeSize = function()
  {
    var result = 1;
    for (let i = 0; i < this.children.length; ++i)
      result += this.children[i].treeSize();
    return result;
  }

  root.getRoot = function()
  {
    let i = this;
    while (i.parent)
      i = i.parent;
    return i;
  }

  root.registerInVirtualMoves = function()
  {
    let myRoot = this.getRoot();
    let index = this.fromXY(this.move.x, this.move.y);
    myRoot.relevantMoves[index] = true;
    besogo.addVirtualChildren(myRoot, this);
  }

  root.setCorrectSource = function(value, editor)
  {
    if (value === this.correctSource)
      return;
    if (this.children.length > 0 || this.virtualChildren.length > 0)
      return;
    this.correctSource = value;
    besogo.updateCorrectValues(this.getRoot());
    editor.notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
  }

  root.checkTsumegoHeroCompatibility = function()
  {
    if (!this.nextIsBlack() &&
        this.children.length == 0 &&
        this.virtualChildren.length == 0 &&
        !this.correctSource)
      return {node: this, message: "Last black move not marked correct"};

    for (let i = 0; i < this.children.length; ++i)
    {
      let result = this.children[i].checkTsumegoHeroCompatibility()
      if (result)
        return result;
    }
    for (let i = 0; i < this.virtualChildren.length; ++i)
    {
      let result = this.virtualChildren[i].target.checkTsumegoHeroCompatibility()
      if (result)
        return result;
    }
    return null;
  }

  return root;
};
