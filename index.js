import { clearOutput, renderChats, isLoggedIn, logout, saveAll, resetAll } from './util.js'
import { LoginPanel } from './loginPanel.js'
import { } from './chatContext.js';
import { traverseModel, renderContents, SlideBar } from './medit.js';

$('#logoutBtn').click(async () => {
    await logout();
})

$('#clearBtn').click(clearOutput);
$('#saveBtn').click(saveAll);
$('#resetBtn').click(resetAll);

$(document).ready(async () => {
    let query = getQueryParams();

    // render entries, and contents
    let entity = await renderChats();
    $('#contents').append(renderContents(entity));
    createJelem(SlideBar, { key: 'contentspanel.width' }).appendTo($('#leftPanel')).wrap().load();

    // popup login panel if not logged in
    if (!isLoggedIn()) {
        createJelem(LoginPanel).wrap().show();
    }
    else {
        entity.getListener().add('root', (event) => {
            if (event.type == 'storageChange' || event.type == 'change' || event.type == 'childEvent' && (event.event.type == 'storageChange' || event.event.type == 'change')) {
                // we will traverse the whole entity and make sync changed
                let totalChanges = 0;
                traverseModel(entity, i => totalChanges += i.getStorageStatus() ? 1 : 0);
                $('#saveBtn').text(`Save All${totalChanges ? (' (' + totalChanges + ')') : ''}`).attr('disabled', totalChanges <= 0);
                $('#resetBtn').text(`Reset${totalChanges ? (' (' + totalChanges + ')') : ''}`).attr('disabled', totalChanges <= 0);
            }
        })
    }
})
