besogo.makeCommentPanel = function(container, editor)
{
  'use strict';
  var infoTexts = {}, // Holds text nodes for game info properties
      statusLabel = null,
      statusTable = null,
      gameInfoTable = document.createElement('table'),
      gameInfoEdit = document.createElement('table'),
      commentBox = document.createElement('div'),
      commentEdit = document.createElement('textarea'),
      playerInfoOrder = 'PW WR WT PB BR BT'.split(' '),
      infoOrder = 'HA KM RU TM OT GN EV PC RO DT RE ON GC AN US SO CP'.split(' '),
      noneSelection = null,
      deadSelection = null,
      koSelection = null,
      koExtraThreats = null,
      sekiSelection = null,
      aliveSelection = null,
      infoIds =
      {
          PW: 'White Player',
          WR: 'White Rank',
          WT: 'White Team',
          PB: 'Black Player',
          BR: 'Black Rank',
          BT: 'Black Team',

          HA: 'Handicap',
          KM: 'Komi',
          RU: 'Rules',
          TM: 'Timing',
          OT: 'Overtime',

          GN: 'Game Name',
          EV: 'Event',
          PC: 'Place',
          RO: 'Round',
          DT: 'Date',

          RE: 'Result',
          ON: 'Opening',
          GC: 'Comments',

          AN: 'Annotator',
          US: 'Recorder',
          SO: 'Source',
          CP: 'Copyright'
      };

  statusLabel = createStatusLabel();
  statusTable = createStatusTable();
  let parentDiv = document.createElement('div');
  container.appendChild(parentDiv);
  var correctButton = makeCorrectVariantButton();
  let correctButtonDiv = document.createElement('div');
  correctButtonDiv.appendChild(correctButton);
  parentDiv.appendChild(correctButtonDiv);
  parentDiv.appendChild(statusLabel);
  parentDiv.appendChild(statusTable);
  container.appendChild(makeCommentButton());
  //container.appendChild(gameInfoTable);
  //container.appendChild(gameInfoEdit);
  infoTexts.C = document.createTextNode('');
  container.appendChild(commentBox);
  commentBox.appendChild(infoTexts.C);
  container.appendChild(commentEdit);

  commentEdit.onblur = function() { editor.setComment(commentEdit.value); };
  commentEdit.addEventListener('keydown', function(evt) {
    evt = evt || window.event;
    evt.stopPropagation(); // Stop keydown propagation when in focus
  });

  editor.addListener(update);
  update({ navChange: true});
  gameInfoEdit.style.display = 'none'; // Hide game info editting table initially

  function preventFocus(event)
  {
    if (event.relatedTarget) // Revert focus back to previous blurring element
      event.relatedTarget.focus();
    else
      this.blur(); // No previous focus target, blur instead
  }

  function createRadioButton(target, name, statusType)
  {
    var selection = document.createElement('input');
    selection.type = "radio";
    selection.id = name;
    selection.name = 'status';
    selection.onclick = function()
    {
      editor.getCurrent().setStatusSource(besogo.makeStatusSimple(statusType));
      updateStatusEditability();
    }
    target.appendChild(selection);

    var label = document.createElement('label');
    label.textContent = name;
    label.htmlFor = name;
    target.appendChild(label);

    return selection;
  }

  function createRadioButtonRow(table, name, statusType, otherInput = null)
  {
    var row = table.insertRow(-1);
    var cell = row.insertCell(0);
    let result = createRadioButton(cell, name, statusType);
    let cell2 = row.insertCell(-1);
    if (otherInput)
      cell2.appendChild(otherInput);
    return result;
  }

  function createStatusLabel()
  {
    var label = document.createElement('label');
    label.style.fontSize = 'x-large';
    return label;
  }

  function createStatusTable()
  {
    var table = document.createElement('table');

    noneSelection = createRadioButtonRow(table, 'none', STATUS_NONE);
    deadSelection = createRadioButtonRow(table, 'dead', STATUS_DEAD);

    koExtraThreats = document.createElement('input');
    koExtraThreats.type = 'text';
    koExtraThreats.oninput = function(event)
    {
      if (!editor.getCurrent().statusSource)
        return;
      if (editor.getCurrent().statusSource.blackFirst.type != STATUS_KO)
        return;
      editor.getCurrent().setStatusSource(besogo.loadStatusFromString('KO' + event.target.value));
      updateStatusLabel();
    }
    koSelection = createRadioButtonRow(table, 'ko', STATUS_KO, koExtraThreats);

    sekiSelection = createRadioButtonRow(table, 'seki', STATUS_SEKI);
    aliveSelection = createRadioButtonRow(table, 'alive', STATUS_ALIVE);

    return table;
  }

  function updateStatusEditability()
  {
    let editable = !editor.getCurrent().hasChildIncludingVirtual();
    noneSelection.disabled = !editable;
    deadSelection.disabled = !editable;
    koSelection.disabled = !editable;
    koExtraThreats.disabled = !editable ||
                              !editor.getCurrent().statusSource ||
                              editor.getCurrent().statusSource.blackFirst.type != STATUS_KO;
    sekiSelection.disabled = !editable;
    aliveSelection.disabled = !editable;
  }

  function getStatusText()
  {
    return 'Status: ' + editor.getCurrent().status.strLong();
  }

  function updateStatusLabel()
  {
    statusLabel.textContent = getStatusText();
  }

  function updateStatus()
  {
    updateStatusLabel();
    updateStatusEditability();
    if (!editor.getCurrent().status ||
        editor.getCurrent().status.blackFirst.type == STATUS_NONE)
    {
      noneSelection.checked = true;
      return;
    }

    if (editor.getCurrent().status.blackFirst.type == STATUS_DEAD)
    {
      deadSelection.checked = true;
      return;
    }

    if (editor.getCurrent().status.blackFirst.type == STATUS_KO)
    {
      koSelection.checked = true;
      koExtraThreats.value = editor.getCurrent().status.blackFirst.getKoStr();
      return;
    }

    if (editor.getCurrent().status.blackFirst.type == STATUS_SEKI)
    {
      sekiSelection.checked = true;
      return;
    }

    if (editor.getCurrent().status.blackFirst.type == STATUS_ALIVE)
    {
      aliveSelection.checked = true;
      return;
    }
  }

  function update(msg)
  {
    updateStatus();

    var temp; // Scratch for strings

    if (msg.navChange)
    {
      temp = editor.getCurrent().comment || '';
      updateText(commentBox, temp, 'C');
      if (editor.getCurrent() === editor.getRoot() &&
          gameInfoTable.firstChild &&
          gameInfoEdit.style.display === 'none')
        gameInfoTable.style.display = 'table';
      else
        gameInfoTable.style.display = 'none';
      commentEdit.style.display = 'none';
      commentBox.style.display = 'block';
    }
    else if (msg.comment !== undefined)
    {
      updateText(commentBox, msg.comment, 'C');
      commentEdit.value = msg.comment;
    }

    updateCorrectButton();
  }

  function updateGameInfoTable(gameInfo)
  {
    var table = document.createElement('table');

    table.className = 'besogo-gameInfo';
    for (let i = 0; i < infoOrder.length ; i++) // Iterate in specified order
    {
      var id = infoOrder[i];

      if (gameInfo[id]) // Only add row if property exists
      {
        var row = document.createElement('tr');
        table.appendChild(row);

        var cell = document.createElement('td');
        cell.appendChild(document.createTextNode(infoIds[id]));
        row.appendChild(cell);

        cell = document.createElement('td');
        var text = document.createTextNode(gameInfo[id]);
        cell.appendChild(text);
        row.appendChild(cell);
      }
    }

    if (!table.firstChild || gameInfoTable.style.display === 'none')
      table.style.display = 'none'; // Do not display empty table or if already hidden
    container.replaceChild(table, gameInfoTable);
    gameInfoTable = table;
  }

  function updateGameInfoEdit(gameInfo)
  {
    var table = document.createElement('table'),
        infoTableOrder = playerInfoOrder.concat(infoOrder),
        row, cell, text;

    table.className = 'besogo-gameInfo';
    for (let i = 0; i < infoTableOrder.length ; i++)
    {
      var id = infoTableOrder[i];
      row = document.createElement('tr');
      table.appendChild(row);

      cell = document.createElement('td');
      cell.appendChild(document.createTextNode(infoIds[id]));
      row.appendChild(cell);

      cell = document.createElement('td');
      text = document.createElement('input');
      if (gameInfo[id])
        text.value = gameInfo[id];
      text.onblur = function(t, id)
      {
        // Commit change on blur
        return function() { editor.setGameInfo(t.value, id); };
      }(text, id);
      text.addEventListener('keydown', function(evt)
      {
        evt = evt || window.event;
        evt.stopPropagation(); // Stop keydown propagation when in focus
      });
      cell.appendChild(text);
      row.appendChild(cell);
    }
    if (gameInfoEdit.style.display === 'none')
      table.style.display = 'none'; // Hide if already hidden
    container.replaceChild(table, gameInfoEdit);
    gameInfoEdit = table;
  }

  function updateText(parent, text, id)
  {
    var textNode = document.createTextNode(text);
    parent.replaceChild(textNode, infoTexts[id]);
    infoTexts[id] = textNode;
  }

  function makeInfoButton()
  {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = 'Info';
    button.title = 'Show/hide game info';

    button.onclick = function()
    {
      if (gameInfoTable.style.display === 'none' && gameInfoTable.firstChild)
        gameInfoTable.style.display = 'table';
      else
        gameInfoTable.style.display = 'none';
      gameInfoEdit.style.display = 'none';
    };
    return button;
  }

  function makeInfoEditButton()
  {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = 'Edit Info';
    button.title = 'Edit game info';

    button.onclick = function()
    {
      if (gameInfoEdit.style.display === 'none')
        gameInfoEdit.style.display = 'table';
      else
        gameInfoEdit.style.display = 'none';
      gameInfoTable.style.display = 'none';
    };
    return button;
  }

  function makeCommentButton()
  {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = 'Comment';
    button.title = 'Edit comment';

    button.onclick = function()
    {
      if (commentEdit.style.display === 'none') // Comment edit box hidden
      {
        commentBox.style.display = 'none'; // Hide static comment display
        gameInfoTable.style.display = 'none'; // Hide game info table
        commentEdit.value = editor.getCurrent().comment;
        commentEdit.style.display = 'block'; // Show comment edit box
      }
      else // Comment edit box open
      {
        commentEdit.style.display = 'none'; // Hide comment edit box
        commentBox.style.display = 'block'; // Show static comment display
      }
    };
    return button;
  }

  function makeCorrectVariantButton()
  {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = 'Incorrect';
    button.title = 'Change incorrect state';
    button.addEventListener('focus', preventFocus);

    button.onclick = function()
    {
      editor.getCurrent().setCorrectSource(!editor.getCurrent().correctSource, editor);
    };
    return button;
  }

  function updateCorrectButton()
  {
    var current = editor.getCurrent();
    if (current.children.length || current.virtualChildren.length)
      correctButton.disabled = true;
    else
      correctButton.disabled = false;

    if (current.correct)
      correctButton.value = 'Make incorrect';
    else
      correctButton.value = 'Make correct';
  }
};
