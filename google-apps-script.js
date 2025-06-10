// Google Apps Script for Voss AI Opportunity Scorecard
// Deploy this as a web app with execute permissions set to "Anyone"
//
// This script creates two sheets:
// 1. "User Data" - Temporary storage for personal information from user-info.html
// 2. "Complete Assessments" - MAIN SHEET with ALL data: user info + scores + free responses
//
// The "Complete Assessments" sheet contains everything in one row per person:
// - Personal info: Name, Email, Industry, Job Title, Role, Org Size, Consent
// - Assessment scores: Overall + 6 dimension scores  
// - Free responses: Strategy Priorities, Operational Bottlenecks, Cultural Barriers, Automation Tasks
// - Readiness Level: Beginner/Intermediate/Advanced classification

function doPost(e) {
  try {
    // Simplified approach - handle both undefined event and valid event
    let data;
    
    if (!e || !e.postData || !e.postData.contents) {
      // Fallback: create dummy data for testing
      console.log('Event object issue - creating test entry');
      data = {
        type: 'test_entry',
        timestamp: new Date().toISOString(),
        note: 'Event object was undefined'
      };
    } else {
      console.log('Received valid POST data');
      data = JSON.parse(e.postData.contents);
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.type === 'user_data') {
      // Store user data temporarily - we'll combine it with assessment results later
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
      // Note: Assessment results now come via GET request, not POST
      console.log('POST assessment_results received (should be GET now)');
      console.log('Data:', data);
      
    } else if (data.type === 'test_entry') {
      // Handle test entries when event object is undefined
      const testSheet = spreadsheet.getSheetByName('Debug Log') || spreadsheet.insertSheet('Debug Log');
      
      if (testSheet.getLastRow() === 0) {
        testSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Issue', 'Status']]);
      }
      
      testSheet.appendRow([new Date(), data.note, 'Event object was undefined - check deployment']);
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
  try {
    console.log('=== GET REQUEST RECEIVED ===');
    console.log('GET event object e:', e);
    console.log('Parameters:', e ? e.parameter : 'no parameters');
    
    if (!e || !e.parameter) {
      return ContentService
        .createTextOutput(JSON.stringify({message: 'Voss AI Scorecard Data Collection API'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const params = e.parameter;
    console.log('All parameters:', params);
    
    if (params.type === 'assessment_results') {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      
      // Create comprehensive results sheet
      const resultsSheet = spreadsheet.getSheetByName('Complete Assessment Results') || spreadsheet.insertSheet('Complete Assessment Results');
      
      // Add headers if this is the first entry
      if (resultsSheet.getLastRow() === 0) {
        resultsSheet.getRange(1, 1, 1, 20).setValues([[
          'Timestamp', 'First Name', 'Email', 'Industry', 'Job Title', 
          'Strategy Score', 'Operations Score', 'Technology Score', 'Data Score', 'Culture Score', 'Automation Score', 'Overall Score',
          'Strategy Open Response', 'Operations Open Response', 'Technology Open Response', 'Data Open Response', 'Culture Open Response', 'Automation Open Response',
          'Readiness Level', 'Source'
        ]]);
      }
      
      console.log('Adding complete assessment data from GET parameters');
      
      // Add the comprehensive data
      resultsSheet.appendRow([
        new Date(),
        params.firstName || 'Unknown',
        params.email || 'No Email',
        params.industry || 'Unknown',
        params.jobTitle || 'Unknown',
        parseInt(params.strategyScore) || 0,
        parseInt(params.operationsScore) || 0,
        parseInt(params.technologyScore) || 0,
        parseInt(params.dataScore) || 0,
        parseInt(params.cultureScore) || 0,
        parseInt(params.automationScore) || 0,
        parseInt(params.overallScore) || 0,
        params.strategyOpen || '',
        params.opsOpen || '',
        params.techOpen || '',
        params.dataOpen || '',
        params.cultureOpen || '',
        params.autoOpen || '',
        params.readinessLevel || '',
        'Web Assessment'
      ]);
      
      // Also maintain the legacy text responses sheet for backward compatibility
      const textSheet = spreadsheet.getSheetByName('Text Responses') || spreadsheet.insertSheet('Text Responses');
      
      if (textSheet.getLastRow() === 0) {
        textSheet.getRange(1, 1, 1, 12).setValues([[
          'Timestamp', 'First Name', 'Email', 'Industry', 'Job Title', 'Strategy Open', 'Operations Open', 
          'Technology Open', 'Data Open', 'Culture Open', 'Automation Open', 'Overall Score'
        ]]);
      }
      
      textSheet.appendRow([
        new Date(),
        params.firstName || 'Unknown',
        params.email || 'No Email',
        params.industry || 'Unknown',
        params.jobTitle || 'Unknown',
        params.strategyOpen || '',
        params.opsOpen || '',
        params.techOpen || '',
        params.dataOpen || '',
        params.cultureOpen || '',
        params.autoOpen || '',
        params.overallScore || 0
      ]);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Complete assessment data saved'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({message: 'Unknown request type'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('GET Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}