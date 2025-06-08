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
        completeSheet.getRange(1, 1, 1, 20).setValues([[
          'Timestamp', 'First Name', 'Email', 'Industry', 'Job Title', 'Role Level', 'Org Size', 'Consent',
          'Overall Score', 'Strategy Score', 'Operations Score', 'Technology Score', 'Data Score', 
          'Culture Score', 'Automation Score', 'Strategy Priorities', 'Operational Bottlenecks',
          'Cultural Barriers', 'Automation Tasks', 'Readiness Level'
        ]]);
      }
      
      // Add complete assessment data (user info + results + free responses)
      // Add some debugging to help troubleshoot
      console.log('Assessment data received:', JSON.stringify(data, null, 2));
      
      completeSheet.appendRow([
        new Date(),
        data.user?.firstName || 'No Name',
        data.user?.email || 'No Email', 
        data.user?.industry || 'No Industry',
        data.user?.jobTitle || 'No Job Title',
        data.user?.role || 'No Role',
        data.user?.orgSize || 'No Org Size',
        data.user?.consentMarketing || 'No Consent',
        data.overallScore || 0,
        data.scores?.strategy || 0,
        data.scores?.operations || 0,
        data.scores?.technology || 0,
        data.scores?.data || 0,
        data.scores?.culture || 0,
        data.scores?.automation || 0,
        data.freeResponses?.strategy_priorities || 'No Strategy Response',
        data.freeResponses?.ops_bottlenecks || 'No Ops Response',
        data.freeResponses?.culture_barriers || 'No Culture Response',
        data.freeResponses?.auto_specific_tasks || 'No Automation Response',
        data.readinessLevel || 'No Level'
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