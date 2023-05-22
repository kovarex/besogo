besogo.updateTreeAsProblem = function(root)
{
  root.hashTable = []
  root.prunnedMoveCount = 0;
  besogo.updateTreeAsProblemInternal(root, root);
  window.alert("Pruned move count: " + root.prunnedMoveCount +
               " (out of original " + (root.prunnedMoveCount + root.treeSize()) + ")");
  besogo.addVirtualChildren(root, root);
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
          
          var sameNode = testChild.getSameNode(root);
          if (sameNode && sameNode.parent != node)
          {
            var redirect = [];
            redirect.target = sameNode;
            redirect.move = [];
            redirect.move.x = x;
            redirect.move.y = y;
            node.virtualChildren.push(redirect);
          }
        }
      }

  for (let i = 0; i < node.children.length; ++i)
    besogo.addVirtualChildren(root, node.children[i]);
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
    if (child.getSameNode(root))
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
