besogo.updateTreeAsProblem = function(root)
{
  root.hashTable = []
  root.prunnedMoveCount = 0;
  besogo.updateTreeAsProblemInternal(root, root);
  window.alert("Pruned move count: " + root.prunnedMoveCount +
               " (out of original " + (root.prunnedMoveCount + root.treeSize()) + ")");
};

besogo.sameNodeExists = function(root, node)
{
  var hash = node.getHash();
  var hashPoint = root.hashTable[hash];
  if (!hashPoint)
    return false;
  for (let i = 0; i < hashPoint.length; ++i)
    if (node.samePositionAs(hashPoint[i]))
      return true;
  return false;
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
    if (besogo.sameNodeExists(root, child))
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
