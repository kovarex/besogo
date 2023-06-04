const STATUS_NONE = 0;
const STATUS_DEAD = 1;
const STATUS_KO = 2;
const STATUS_SEKI = 3;
const STATUS_ALIVE = 4;
const STATUS_ALIVE_NONE = 5;

besogo.makeStatusInternal = function(type)
{
  var status = [];
  status.type = type;

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

besogo.loadStatusFromString = function(str)
{
  var status = [];
  var parts = str.split('/');
  if (parts.length == 1)
    return besogo.makeStatus(besogo.loadStatusInternalFromString(str));
  return besogo.makeStatus(besogo.loadStatusInternalFromString(parts[0]),
                           besogo.loadStatusInternalFromString(parts[1]));
}

besogo.loadStatusInternalFromString = function(str)
{
  if (str == "DEAD")
    return besogo.makeStatusInternal(STATUS_DEAD);
  if (str == "KO")
    return besogo.makeStatusInternal(STATUS_KO);
  if (str == "SEKI")
    return besogo.makeStatusInternal(STATUS_SEKI);
  if (str == "ALIVE")
    return besogo.makeStatusInternal(STATUS_ALIVE);
}

besogo.makeStatus = function(blackFirst, whiteFirst = null)
{
  var status = [];
  status.blackFirst = blackFirst;
  status.whiteFirst = whiteFirst ? whiteFirst : besogo.makeStatusInternal(STATUS_ALIVE);

  status.str = function()
  {
    var result = "";
    if (this.whiteFirst.type != STATUS_ALIVE)
    {
      result += this.whiteFirst.str();
      result += "/";
    }
    result += this.blackFirst.str();
    return result;
  }

  status.better = function(other)
  {
    if (this.blackFirst.type == STATUS_NONE)
      return false;
    if (this.blackFirst.type != other.blackFirst.type)
      return this.blackFirst.type < other.blackFirst.type;
    return false;
  }

  return status;
}
