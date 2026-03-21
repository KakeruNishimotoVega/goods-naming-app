var global = this;
"use strict";
(() => {
  // src/index.ts
  var doGet = (e) => {
    return HtmlService.createHtmlOutputFromFile("index").setTitle("\u5546\u54C1\u540D\u30FB\u30AD\u30E3\u30C3\u30C1\u30B3\u30D4\u30FC\u547D\u540D\u30A2\u30D7\u30EA").addMetaTag("viewport", "width=device-width, initial-scale=1");
  };
  global.doGet = doGet;
  var testSupabaseConnection = () => {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase\u306E\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u30B9\u30AF\u30EA\u30D7\u30C8\u30D7\u30ED\u30D1\u30C6\u30A3\u306BSUPABASE_URL\u3068SUPABASE_SERVICE_ROLE_KEY\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/categories?select=*`;
    const options = {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      // エラー時も例外で落とさず、レスポンスの中身を確認できるようにする設定
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    console.log("\u30B9\u30C6\u30FC\u30BF\u30B9\u30B3\u30FC\u30C9:", response.getResponseCode());
    console.log("\u30EC\u30B9\u30DD\u30F3\u30B9\u5185\u5BB9:", response.getContentText());
  };
  global.testSupabaseConnection = testSupabaseConnection;
})();

function doGet() { return global.doGet.apply(this, arguments); }
function testSupabaseConnection() { return global.testSupabaseConnection.apply(this, arguments); }