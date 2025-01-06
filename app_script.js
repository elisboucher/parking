function doGet(e) {
    return handleOptions();
}

function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    const data = JSON.parse(e.postData.contents);

    if (data.action === "check-in") {
        sheet.appendRow([data.name, new Date(), "", "", new Date()]);
        return createResponse({ status: "success", message: "Checked in successfully" });
    }

    if (data.action === "check-out") {
        const rows = sheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
            if (rows[i][0] === data.name && !rows[i][2]) {
                const checkInTime = new Date(rows[i][1]);
                const checkOutTime = new Date();
                const duration = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);
                sheet.getRange(i + 1, 3).setValue(checkOutTime);
                sheet.getRange(i + 1, 4).setValue(duration);
                return createResponse({
                    status: "success",
                    message: `Checked out successfully. Duration: ${duration} hours.`,
                });
            }
        }
        return createResponse({ status: "error", message: "Check-in not found" });
    }

    return createResponse({ status: "error", message: "Invalid action" });
}

function handleOptions() {
    return ContentService.createTextOutput("{}").setMimeType(ContentService.MimeType.JSON)
}

function createResponse(content) {
    return ContentService.createTextOutput(JSON.stringify(content))
        .setMimeType(ContentService.MimeType.JSON)
}

