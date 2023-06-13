besogo.updateTreeAsProblem = function(root)
{
  root.prunnedMoveCount = 0;
  besogo.pruneTree(root, root);
  if (root.prunnedMoveCount)
    window.alert("Pruned move count: " + root.prunnedMoveCount +
                 " (out of original " + (root.prunnedMoveCount + root.treeSize()) + ")");
  besogo.addRelevantMoves(root, root)
  var test = 0;
  for (let i = 0; i < root.relevantMoves.length; ++i)
    if (root.relevantMoves[i])
      ++test;
  besogo.addVirtualChildren(root, root, false);
  besogo.updateCorrectValues(root);
};

besogo.addRelevantMoves = function(root, node)
{
  for (let i = 0; i < node.setupStones.length; ++i)
    if (node.setupStones[i])
      root.relevantMoves[i] = true;
  if (node.move)
  {
    var move = [];
    move.x = node.move.x;
    move.y = node.move.y;
    root.relevantMoves[root.fromXY(node.move.x, node.move.y)] = true;
  }
  for (let i = 0; i < node.children.length; ++i)
    besogo.addRelevantMoves(root, node.children[i]);
}

besogo.addVirtualChildren = function(root, node, addHash = true)
{
  if (addHash)
    root.nodeHashTable.push(node);

  var sizeX = root.getSize().x;
  var sizeY = root.getSize().y;
  for (let i = 0; i < root.relevantMoves.length; ++i)
  {
    if (!root.relevantMoves[i])
      continue;
    var move = root.toXY(i);
    if (!node.getStone(move.x, move.y))
    {
      var testChild = node.makeChild()
      if (!testChild.playMove(move.x, move.y))
      {
        node.removeChild(testChild);
        continue;
      }

      var sameNode = root.nodeHashTable.getSameNode(testChild);
      if (sameNode && sameNode.parent != node)
      {
        var redirect = [];
        redirect.target = sameNode;
        redirect.move = [];
        redirect.move.x = move.x;
        redirect.move.y = move.y;
        redirect.move.captures = testChild.move.captures;
        redirect.move.color = node.nextMove();
        node.virtualChildren.push(redirect);
        redirect.target.virtualParents.push(node);
        node.correctSource = false;
      }
    }
  }

  for (let i = 0; i < node.children.length; ++i)
    besogo.addVirtualChildren(root, node.children[i], addHash);
}

besogo.pruneTree = function(root, node)
{
  root.nodeHashTable.push(node);
  for (let i = 0; i < node.children.length;)
  {
    var child = node.children[i];
    if (root.nodeHashTable.getSameNode(child))
    {
      root.prunnedMoveCount += child.treeSize();
      node.removeChild(child);
    }
    else
    {
      besogo.pruneTree(root, child);
      ++i;
    }
  }
};

besogo.clearCorrectValues = function(node)
{
  delete node.correct;
  node.status = null;
  if (node.hasChildIncludingVirtual())
    node.statusSource = null;
  for (let i = 0; i < node.children.length; ++i)
    besogo.clearCorrectValues(node.children[i]);
}

besogo.updateCorrectValues = function(root)
{
  besogo.clearCorrectValues(root);
  besogo.updateStatusValuesInternal(root);
  if (root.goal == GOAL_NONE)
    besogo.updateCorrectValuesInternal(root);
  else
    besogo.updateCorrectValuesBasedOnStatus(root, root.status, true /* isCorrectBranch */);
}

besogo.updateStatusResult = function(blacksMove, child, status)
{
  if (child.status.better(status) == blacksMove)
    return child.status;
  else
    return status;
}

besogo.updateStatusValuesInternal = function(node)
{
  if (node.statusSource)
  {
    console.assert(!node.hasChildIncludingVirtual());
    node.status = node.statusSource;
    return;
  }
  if (node.status)
    return;

  for (let i = 0; i < node.children.length; ++i)
    besogo.updateStatusValuesInternal(node.children[i]);
  for (let i = 0; i < node.virtualChildren.length; ++i)
    besogo.updateStatusValuesInternal(node.virtualChildren[i].target);

  if (node.nextIsBlack())
    node.status = besogo.makeStatusSimple(STATUS_ALIVE_NONE);
  else
    node.status = besogo.makeStatusSimple(STATUS_NONE);
  var blacksMove = node.nextIsBlack();

  for (let i = 0; i < node.children.length; ++i)
    node.status = besogo.updateStatusResult(blacksMove, node.children[i], node.status);
  for (let i = 0; i < node.virtualChildren.length; ++i)
    node.status = besogo.updateStatusResult(blacksMove, node.virtualChildren[i].target, node.status);

  if (node.status.blackFirst.type == STATUS_ALIVE_NONE)
    node.status = besogo.makeStatusSimple(STATUS_NONE);
}

besogo.updateCorrectValuesInternal = function(node)
{
  if (node.comment.startsWith("+"))
  {
    if (!node.correctSource)
    {
      node.correctSource = true;
      node.comment = node.comment.substr(1);
    }
    node.correct = true;
    return true;
  }

  if (node.correctSource)
  {
    node.correct = true;
    return true;
  }

  if (node.hasOwnProperty("correct"))
    return node.correct;

  var hasLoss = false;
  var hasWin = false;

  for (let i = 0; i < node.children.length; ++i)
    if (besogo.updateCorrectValuesInternal(node.children[i]))
      hasWin = true;
    else
      hasLoss = true;

  for (let i = 0; i < node.virtualChildren.length; ++i)
    if (besogo.updateCorrectValuesInternal(node.virtualChildren[i].target))
      hasWin = true;
    else
      hasLoss = true;

  // We assume here, that black is player, white is the enemy.
  // This means, that if black can play a better move to get to a different variation, it is ok.
  // But if white can play a different move which leads to a variation good for black, white obviously wouldn'tags
  // choose this move in this situation.

  if (node.nextIsBlack())
    node.correct = hasWin;
  else
    node.correct = hasWin && !hasLoss;

  return node.correct;
};

besogo.updateCorrectValuesBasedOnStatus = function(node, parentStatus, isCorrectBranch)
{
  if (node.hasOwnProperty("correct"))
    return;

  node.correct = isCorrectBranch && !parentStatus.better(node.status);

  for (let i = 0; i < node.children.length; ++i)
    besogo.updateCorrectValuesBasedOnStatus(node.children[i], node.status, node.correct)
  for (let i = 0; i < node.virtualChildren.length; ++i)
    besogo.updateCorrectValuesBasedOnStatus(node.virtualChildren[i].target, node.status, node.correct);
};
