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
      return result = 'KO' + this.getKoStr();

    if (this.type == STATUS_SEKI)
      return "SEKI";
    if (this.type == STATUS_ALIVE)
      return "ALIVE";
  }

  status.strLong = function()
  {
    if (this.type == STATUS_KO)
      return result = this.str() + ' (' + this.getKoStrLong() + ')';
    return this.str();
  }

  status.getKoStr = function()
  {
    console.assert(this.type == STATUS_KO);
    let result = '';
    if (!this.extraThreats || this.extraThreats >= 0)
      result += "+";
    else
      result += "-";

    if (this.extraThreats > 0)
      result += (this.extraThreats + 1)
    else if (this.extraThreats < -1)
      result += -this.extraThreats;
    return result;
  }

  status.getKoStrLong = function()
  {
    console.assert(this.type == STATUS_KO);
    let result = '';
    if (!this.extraThreats || this.extraThreats == 0)
      return 'Black takes first';
    if (this.extraThreats == -1)
      return 'White takes first';
    if (this.extraThreats > 0)
      return 'White needs ' + this.extraThreats + ' threat' + (this.extraThreats > 1 ? 's' : '') + ' to start the ko';
    if (this.extraThreats < 0)
      return 'Black needs ' + (-this.extraThreats - 1) + ' threat' + (this.extraThreats < -2 ? 's' : '') + ' to start the ko';
  }

  status.setKo = function(extraThreats)
  {
    this.type = STATUS_KO;
    this.extraThreats = extraThreats;
  }

  status.better = function(other)
  {
    if (this.type != other.type)
      return this.type < other.type;
    if (this.type == STATUS_KO)
      return this.extraThreats > other.extraThreats;
    return false;
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
  if (str == "SEKI")
    return besogo.makeStatusInternal(STATUS_SEKI);
  if (str == "ALIVE")
    return besogo.makeStatusInternal(STATUS_ALIVE);

  if (str.length >= 2 && str[0] == "K" && str[1] == "O")
  {
    let result = besogo.makeStatusInternal(STATUS_KO);
    if (str.length == 2)
      return result;
    if (str[2] == "+")
    {
      if (str.length == 3)
      {
        result.extraThreats = 0;
        return result;
      }
      let number = Number(str.substr(3, str.length - 3));
      result.extraThreats = number - 1;
      return result;
    }
    if (str[2] == "-")
    {
      if (str.length == 3)
      {
        result.extraThreats = -1;
        return result;
      }
      let number = Number(str.substr(3, str.length - 3));
      result.extraThreats = -number;
      return result;
    }
  }
}

besogo.makeStatus = function(blackFirst = null, whiteFirst = null)
{
  var status = [];
  status.blackFirst = blackFirst ? blackFirst : besogo.makeStatusInternal(STATUS_NONE);
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

  status.strLong = function()
  {
    var result = "";
    if (this.whiteFirst.type != STATUS_ALIVE)
    {
      result += this.whiteFirst.strLong();
      result += "/";
    }
    result += this.blackFirst.strLong();
    return result;
  }

  status.better = function(other)
  {
    if (this.blackFirst.type == STATUS_NONE)
      return false;
    return this.blackFirst.better(other.blackFirst);
  }

  status.setKo = function(extraThreats)
  {
    this.blackFirst.setKo(extraThreats);
  }

  return status;
}
