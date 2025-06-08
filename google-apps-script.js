// Google Apps Script for Voss AI Opportunity Scorecard
// Deploy this as a web app with execute permissions set to "Anyone"
//
// This script creates two sheets:
// 1. "User Data" - Stores personal information from user-info.html
// 2. "Assessment Results" - Stores scores and free responses from results-new.html
//
// Free response questions captured:
// - Strategy Priorities (strategy_priorities)
// - Operational Bottlenecks (ops_bottlenecks) 
// - Cultural Barriers (culture_barriers)
// - Automation Tasks (auto_specific_tasks)

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.type === 'user_data') {
      // Handle user information from index.html
      const userSheet = spreadsheet.getSheetByName('User Data') || spreadsheet.insertSheet('User Data');
      
      // Add headers if this is the first entry
      if (userSheet.getLastRow() === 0) {
        userSheet.getRange(1, 1, 1, 8).setValues([[
          'Timestamp', 'First Name', 'Email', 'Industry', 'Job Title', 'Role Level', 'Org Size', 'Consent'
        ]]);
      }
      
      // Add user data
      userSheet.appendRow([
        new Date(),
        data.firstName || '',
        data.email || '',
        data.industry || '',
        data.jobTitle || '',
        data.role || '',
        data.orgSize || '',
        data.consentMarketing || false
      ]);
      
    } else if (data.type === 'assessment_results') {
      // Handle assessment results from results.html
      const resultsSheet = spreadsheet.getSheetByName('Assessment Results') || spreadsheet.insertSheet('Assessment Results');
      
      // Add headers if this is the first entry
      if (resultsSheet.getLastRow() === 0) {
        resultsSheet.getRange(1, 1, 1, 16).setValues([[
          'Timestamp', 'Email', 'First Name', 'Industry', 'Role', 'Overall Score', 
          'Strategy Score', 'Operations Score', 'Technology Score', 'Data Score', 
          'Culture Score', 'Automation Score', 'Strategy Priorities', 'Operational Bottlenecks',
          'Cultural Barriers', 'Automation Tasks'
        ]]);
      }
      
      // Add results data
      resultsSheet.appendRow([
        new Date(),
        data.user?.email || '',
        data.user?.firstName || '',
        data.user?.industry || '',
        data.user?.role || '',
        data.overallScore || 0,
        data.scores?.strategy || 0,
        data.scores?.operations || 0,
        data.scores?.technology || 0,
        data.scores?.data || 0,
        data.scores?.culture || 0,
        data.scores?.automation || 0,
        data.freeResponses?.strategy_priorities || '',
        data.freeResponses?.ops_bottlenecks || '',
        data.freeResponses?.culture_barriers || '',
        data.freeResponses?.auto_specific_tasks || ''
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Data saved successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({message: 'Voss AI Scorecard Data Collection API'}))
    .setMimeType(ContentService.MimeType.JSON);
}