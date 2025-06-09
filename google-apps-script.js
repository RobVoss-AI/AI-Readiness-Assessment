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
    // Add debugging for the event object
    console.log('=== EVENT DEBUGGING ===');
    console.log('Event object e:', e);
    console.log('e type:', typeof e);
    console.log('e keys:', e ? Object.keys(e) : 'e is null/undefined');
    console.log('e.postData:', e ? e.postData : 'e is null/undefined');
    console.log('e.postData type:', e && e.postData ? typeof e.postData : 'postData is null/undefined');
    
    if (!e) {
      throw new Error('Event object is undefined');
    }
    
    if (!e.postData) {
      throw new Error('postData is undefined - this might be a GET request instead of POST');
    }
    
    if (!e.postData.contents) {
      throw new Error('postData.contents is undefined');
    }
    
    console.log('postData.contents:', e.postData.contents);
    console.log('=== END EVENT DEBUGGING ===');
    
    const data = JSON.parse(e.postData.contents);
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
      // Create one comprehensive sheet with ALL data
      const completeSheet = spreadsheet.getSheetByName('Complete Assessments') || spreadsheet.insertSheet('Complete Assessments');
      
      // Add headers if this is the first entry
      if (completeSheet.getLastRow() === 0) {
        completeSheet.getRange(1, 1, 1, 26).setValues([[
          'Timestamp', 'First Name', 'Email', 'Industry', 'Job Title', 'Role Level', 'Org Size', 'Consent',
          'Overall Score', 'Strategy Score', 'Operations Score', 'Technology Score', 'Data Score', 
          'Culture Score', 'Automation Score', 'Strategy Open', 'Operations Open', 'Technology Open',
          'Data Open', 'Culture Open', 'Automation Open', 'Strategy Priorities', 'Operational Bottlenecks',
          'Cultural Barriers', 'Automation Tasks', 'Readiness Level'
        ]]);
      }
      
      // Add complete assessment data (user info + results + free responses)
      // Add comprehensive debugging to help troubleshoot
      console.log('=== DEBUGGING ASSESSMENT DATA ===');
      console.log('Full data object:', JSON.stringify(data, null, 2));
      console.log('Data type:', data.type);
      console.log('User data structure:', data.user);
      console.log('Scores structure:', data.scores);
      console.log('FreeResponses structure:', data.freeResponses);
      console.log('Individual score checks:');
      console.log('  data.scores?.strategy:', data.scores?.strategy);
      console.log('  data.strategyScore:', data.strategyScore);
      console.log('  data.scores?.operations:', data.scores?.operations);
      console.log('  data.operationsScore:', data.operationsScore);
      console.log('Free response checks:');
      console.log('  data.freeResponses?.strategy_open:', data.freeResponses?.strategy_open);
      console.log('  data.freeResponses?.ops_open:', data.freeResponses?.ops_open);
      console.log('=== END DEBUGGING ===');
      
      completeSheet.appendRow([
        new Date(),                                                              // 1. Timestamp
        data.user?.firstName || data.firstName || 'No Name',                    // 2. First Name  
        data.user?.email || data.email || 'No Email',                          // 3. Email
        data.user?.industry || data.industry || 'No Industry',                 // 4. Industry
        data.user?.jobTitle || data.jobTitle || 'No Job Title',                // 5. Job Title
        data.user?.role || data.role || 'No Role',                             // 6. Role Level
        data.user?.orgSize || data.orgSize || 'No Org Size',                   // 7. Org Size
        data.user?.consentMarketing || data.consentMarketing || 'No Consent',  // 8. Consent
        data.overallScore || 0,                                                 // 9. Overall Score
        data.scores?.strategy || data.strategyScore || 0,                       // 10. Strategy Score
        data.scores?.operations || data.operationsScore || 0,                  // 11. Operations Score
        data.scores?.technology || data.technologyScore || 0,                  // 12. Technology Score
        data.scores?.data || data.dataScore || 0,                              // 13. Data Score
        data.scores?.culture || data.cultureScore || 0,                        // 14. Culture Score
        data.scores?.automation || data.automationScore || 0,                  // 15. Automation Score
        data.freeResponses?.strategy_open || '',                               // 16. Strategy Open
        data.freeResponses?.ops_open || '',                                    // 17. Operations Open  
        data.freeResponses?.tech_open || '',                                   // 18. Technology Open
        data.freeResponses?.data_open || '',                                   // 19. Data Open
        data.freeResponses?.culture_open || '',                                // 20. Culture Open
        data.freeResponses?.auto_open || '',                                   // 21. Automation Open
        data.freeResponses?.strategy_priorities || data.strategy_priorities || '', // 22. Strategy Priorities
        data.freeResponses?.ops_bottlenecks || data.ops_bottlenecks || '',        // 23. Operational Bottlenecks
        data.freeResponses?.culture_barriers || data.culture_barriers || '',     // 24. Cultural Barriers
        data.freeResponses?.auto_specific_tasks || data.auto_specific_tasks || '', // 25. Automation Tasks
        data.readinessLevel || 'No Level'                                       // 26. Readiness Level
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
  console.log('=== GET REQUEST RECEIVED ===');
  console.log('GET event object e:', e);
  console.log('GET e type:', typeof e);
  console.log('GET e keys:', e ? Object.keys(e) : 'e is null/undefined');
  console.log('=== END GET DEBUGGING ===');
  
  return ContentService
    .createTextOutput(JSON.stringify({message: 'Voss AI Scorecard Data Collection API - This should be a POST request!'}))
    .setMimeType(ContentService.MimeType.JSON);
}