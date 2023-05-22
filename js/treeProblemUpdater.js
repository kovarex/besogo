besogo.updateTreeAsProblem = function(root)
{
  root.hashTable = []
  root.prunnedMoveCount = 0;
  besogo.updateTreeAsProblemInternal(root, root);
  besogo.addVirtualChildren(root, root);
  window.alert("Pruned move count: " + root.prunnedMoveCount +
               " (out of original " + (root.prunnedMoveCount + root.treeSize()) + ")");
};

besogo.addVirtualChildren = function(root, node)
{
  node.virtualChildren = [];
  var sizeX = root.getSize().x;
  var sizeY = root.getSize().y;
  for (let x = 1; x <= sizeX; x++)
    for (let y = 1; y <= sizeY; y++)
      if (!node.getStone(x, y))
      {
        var testBoard = Object.create(node);
        var testChild = testBoard.makeChild()
        if (testChild.playMove(x, y))
        {
          var sameNode = besogo.getSameNode(root, testChild);
          if (sameNode)
            node.virtualChildren.push(sameNode);
        }
      }
  for (let i = 0; i < node.children.length; ++i)
    besogo.addVirtualChildren(root, node.children[i]);
}

besogo.getSameNode = function(root, node)
{
  var hash = node.getHash();
  var hashPoint = root.hashTable[hash];
  if (!hashPoint)
    return null;
  for (let i = 0; i < hashPoint.length; ++i)
    if (node.samePositionAs(hashPoint[i]))
      return node;
  return null;
}

besogo.updateTreeAsProblemInternal = function(root, node)
{
  var hash = node.getHash();
  if (!root.hashTable[hash])
    root.hashTable[hash] = []
  root.hashTable[hash].push(node)

  if (node.comment === "+")
  {
    node.correct = true;
    return true;
  }
  
  node.correct = false;
  
  for (let i = 0; i < node.children.length;)
  {
    var child = node.children[i];
    if (besogo.getSameNode(root, child))
    {
      root.prunnedMoveCount += child.treeSize();
      node.removeChild(child);
    }
    else
    {
      if (besogo.updateTreeAsProblemInternal(root, child))
        node.correct = true;
      ++i;
    }
  }
  return node.correct;
};
