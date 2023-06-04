besogo.addTest("Status", "None", function()
{
  let status = besogo.makeStatusSimple(STATUS_NONE);
  CHECK_EQUALS(status.blackFirst.type, STATUS_NONE);
});

besogo.addTest("Status", "StatusKoThreatsSimple", function()
{
  let status1 = besogo.makeStatus();
  status1.setKo(0);
  CHECK_EQUALS(status1.str(), "KO+");

  let status2 = besogo.makeStatus();
  status2.setKo(-1);
  CHECK_EQUALS(status2.str(), "KO-");

  CHECK(status1.better(status2));
  CHECK(!status2.better(status1));
});

besogo.addTest("Status", "StatusKoThreatsHigher", function()
{
  let status1 = besogo.makeStatus();
  status1.setKo(1);
  CHECK_EQUALS(status1.str(), "KO+2");

  let status2 = besogo.makeStatus();
  status2.setKo(0);
  CHECK_EQUALS(status2.str(), "KO+");

  CHECK(status1.better(status2));
  CHECK(!status2.better(status1));
});

besogo.addTest("Status", "StatusKoThreatsSaveLoad", function()
{
  for (let extraThreats = -3; extraThreats < 4; ++extraThreats)
  {
    let status1 = besogo.makeStatus();
    status1.setKo(extraThreats);
    let str = status1.str();
    let status2 = besogo.loadStatusFromString(str);
    CHECK_EQUALS(status2.blackFirst.extraThreats, extraThreats);
  }
});

besogo.addTest("Status", "SaveLoadKo", function()
{
  let status = besogo.makeStatusSimple(STATUS_KO);
  let str = status.str();
  let statusLoaded = besogo.loadStatusFromString(str);
  CHECK_EQUALS(status.blackFirst.type, STATUS_KO);
});

besogo.addTest("Status", "DeadBetterThanko", function()
{
  let status1 = besogo.makeStatusSimple(STATUS_DEAD);
  let status2 = besogo.makeStatusSimple(STATUS_KO);
  CHECK(status1.better(status2));
  CHECK(!status2.better(status1));
});

besogo.addTest("Status", "InitStatusOnLoadWithoutNone", function()
{
  let editor = besogo.makeEditor();
  let childDead = editor.getRoot().registerMove(1, 1);
  childDead.setStatusSource(besogo.makeStatusSimple(STATUS_DEAD));

  let childKo = editor.getRoot().registerMove(2, 1);
  childKo.setStatusSource(besogo.makeStatusSimple(STATUS_KO));

  CHECK_EQUALS(editor.getRoot().children.length, 2);

  let editor2 = besogo.makeEditor();
  besogo.loadSgf(besogo.parseSgf(besogo.composeSgf(editor)), editor2);

  CHECK_EQUALS(editor2.getRoot().children.length, 2);
});

besogo.addTest("Status", "InitStatusOnLoad", function()
{
  let editor = besogo.makeEditor();
  let childDead = editor.getRoot().registerMove(1, 1);
  childDead.setStatusSource(besogo.makeStatusSimple(STATUS_DEAD));

  let childKo = editor.getRoot().registerMove(2, 1);
  childKo.setStatusSource(besogo.makeStatusSimple(STATUS_KO));

  let childNone = editor.getRoot().registerMove(3, 1);
  CHECK_EQUALS(editor.getRoot().children.length, 3);

  let editor2 = besogo.makeEditor();
  besogo.loadSgf(besogo.parseSgf(besogo.composeSgf(editor)), editor2);

  CHECK_EQUALS(editor2.getRoot().children.length, 3);
});
