besogo.updateTreeAsProblem = function(root)
{
  root.hashTable = []
  root.prunnedMoveCount = 0;
  besogo.pruneTree(root, root);
  window.alert("Pruned move count: " + root.prunnedMoveCount +
               " (out of original " + (root.prunnedMoveCount + root.treeSize()) + ")");
  besogo.addVirtualChildren(root, root);
  besogo.clearCorrectValues(root);
  besogo.updateCorrectValues(root);
};

besogo.addVirtualChildren = function(root, node)
{
  var sizeX = root.getSize().x;
  var sizeY = root.getSize().y;
  for (let x = 1; x <= sizeX; x++)
    for (let y = 1; y <= sizeY; y++)
      if (!node.getStone(x, y))
      {
        var testChild = node.makeChild()
        if (!testChild.playMove(x, y))
          node.removeChild(testChild);

        var sameNode = testChild.getSameNode(root);
        if (sameNode && sameNode.parent != node)
        {
          var redirect = [];
          redirect.target = sameNode;
          redirect.move = [];
          redirect.move.x = x;
          redirect.move.y = y;
          redirect.move.color = node.nextMove();
          node.virtualChildren.push(redirect);
        }
      }

  for (let i = 0; i < node.children.length; ++i)
    besogo.addVirtualChildren(root, node.children[i]);
}

besogo.pruneTree = function(root, node)
{
  var hash = node.getHash();
  if (!root.hashTable[hash])
    root.hashTable[hash] = []
  root.hashTable[hash].push(node)

  for (let i = 0; i < node.children.length;)
  {
    var child = node.children[i];
    if (child.getSameNode(root))
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
  for (let i = 0; i < node.children.length; ++i)
    besogo.clearCorrectValues(node.children[i]);
}

besogo.updateCorrectValues = function(node)
{
  if ('correct' in node)
    return node.correct;

  if (node.comment === "+")
  {
    node.correct = true;
    return true;
  }

  var hasLoss = false;
  var hasWin = false;

  for (let i = 0; i < node.children.length; ++i)
    if (besogo.updateCorrectValues(node.children[i]))
      hasWin = true;
    else
      hasLoss = true;

  for (let i = 0; i < node.virtualChildren.length; ++i)
    if (besogo.updateCorrectValues(node.virtualChildren[i].target))
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
