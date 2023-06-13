besogo.makeTransformation = function()
{
  var transformation = [];
  
  transformation.hFlip = false;
  transformation.vFlip = false;
  
  transformation.apply = function(position, size)
  {
    let result = [];
    result.x = position.x;
    result.y = position.y;
    if (this.hFlip)
      result.x = size.x - position.x + 1;
    if (this.vFlip)
      result.y = size.y - position.y + 1;
    return result;
  }

  return transformation;
}
