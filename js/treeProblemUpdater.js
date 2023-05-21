besogo.updateTreeAsProblem = function(node)
{
  if (node.comment === "+")
  {
    node.correct = true;
    return true;
  }
  
  node.correct = false;
  
  for (let i = 0; i < node.children.length; i++)
    if (besogo.updateTreeAsProblem(node.children[i]))
      node.correct = true
  return node.correct;
};
