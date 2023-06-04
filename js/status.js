const STATUS_NONE = 0;
const STATUS_DEAD = 1;
const STATUS_KO = 2;
const STATUS_SEKI = 3;
const STATUS_ALIVE = 4;

besogo.makeStatusInternal = function(type)
{
  var status = { type: type};
  
  status.str = function()
  {
    if (this.type == STATUS_DEAD)
      return "DEAD";
    if (this.type == STATUS_KO)
      return "KO";
    if (this.type == STATUS_SEKI)
      return "SEKI";
    if (this.type == STATUS_ALIVE)
      return "ALIVE";
  }
  return status;
}

besogo.makeStatusSimple = function(blackFirstType)
{
  return besogo.makeStatus(besogo.makeStatusInternal(blackFirstType));
}

besogo.makeStatus = function(blackFirst)
{
  var status = [];
  status.whiteFirst = besogo.makeStatusInternal(STATUS_ALIVE);
  status.blackFirst = blackFirst;
  
  status.str = function()
  {
    var result = "";
    if (this.whiteFirst.status != STATUS_ALIVE)
    {
      result += this.whiteFirst.str();
      result += "/";
    }
    result += this.blackFirst.str();
    return result;
  }
  
  return status;
}
