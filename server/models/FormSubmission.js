const supabase = require("../config/supabase");

// Form submission management functions using Supabase
async function createFormSubmission(submissionData) {
  const { data, error } = await supabase
    .from("form_submissions")
    .insert([submissionData]);
  return { data, error };
}

async function getFormSubmissionsByType(formType) {
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("formType", formType);
  return { data, error };
}

module.exports = {
  createFormSubmission,
  getFormSubmissionsByType,
};
