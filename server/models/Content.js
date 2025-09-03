const supabase = require("../config/supabase");

// Content management functions using Supabase
async function createContent(contentData) {
  const { data, error } = await supabase.from("content").insert([contentData]);
  return { data, error };
}

async function getContentBySection(section) {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("section", section);
  return { data, error };
}

module.exports = {
  createContent,
  getContentBySection,
};
