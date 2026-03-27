var global = this;
"use strict";
(() => {
  // src/api/categories.ts
  function getCategories() {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/categories?select=*&order=name.asc`;
    const options = {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`DB\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const categories = JSON.parse(response.getContentText());
    const categoriesWithParent = categories.map((category) => {
      if (category.parent_id) {
        const parent = categories.find((c) => c.id === category.parent_id);
        return {
          ...category,
          parent_name: parent ? parent.name : null
        };
      }
      return category;
    });
    return categoriesWithParent;
  }
  function getParentCategories() {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/categories?select=*&parent_id=is.null&order=name.asc`;
    const options = {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`DB\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    return JSON.parse(response.getContentText());
  }
  function getSchemaForCategory(categoryId) {
    if (!categoryId) {
      throw new Error("categoryId\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const categoryEndpoint = `${supabaseUrl}/rest/v1/categories?select=*&id=eq.${categoryId}`;
    const categoryResponse = UrlFetchApp.fetch(categoryEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (categoryResponse.getResponseCode() !== 200) {
      throw new Error(`\u30AB\u30C6\u30B4\u30EA\u53D6\u5F97\u30A8\u30E9\u30FC: ${categoryResponse.getContentText()}`);
    }
    const categories = JSON.parse(categoryResponse.getContentText());
    if (categories.length === 0) {
      throw new Error(`\u6307\u5B9A\u3055\u308C\u305F\u30AB\u30C6\u30B4\u30EA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ${categoryId}`);
    }
    const category = categories[0];
    const typesEndpoint = `${supabaseUrl}/rest/v1/types?select=*&category_id=eq.${categoryId}&order=priority.asc`;
    const typesResponse = UrlFetchApp.fetch(typesEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (typesResponse.getResponseCode() !== 200) {
      throw new Error(`Types\u53D6\u5F97\u30A8\u30E9\u30FC: ${typesResponse.getContentText()}`);
    }
    const types = JSON.parse(typesResponse.getContentText());
    const typesWithKeywords = types.map((type) => {
      const keywordsEndpoint = `${supabaseUrl}/rest/v1/keywords?select=*&type_id=eq.${type.id}&order=priority.asc`;
      const keywordsResponse = UrlFetchApp.fetch(keywordsEndpoint, {
        method: "get",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        muteHttpExceptions: true
      });
      const keywords = keywordsResponse.getResponseCode() === 200 ? JSON.parse(keywordsResponse.getContentText()) : [];
      return {
        type,
        keywords
      };
    });
    const regulationsEndpoint = `${supabaseUrl}/rest/v1/regulations?select=*&category_id=eq.${categoryId}`;
    const regulationsResponse = UrlFetchApp.fetch(regulationsEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (regulationsResponse.getResponseCode() !== 200) {
      throw new Error(`Regulations\u53D6\u5F97\u30A8\u30E9\u30FC: ${regulationsResponse.getContentText()}`);
    }
    const regulations = JSON.parse(regulationsResponse.getContentText());
    const fieldsEndpoint = `${supabaseUrl}/rest/v1/fields?select=*&order=priority.asc`;
    const fieldsResponse = UrlFetchApp.fetch(fieldsEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    const fields = fieldsResponse.getResponseCode() === 200 ? JSON.parse(fieldsResponse.getContentText()) : [];
    const hasTypes = types.length > 0;
    const hasRegulations = regulations.length > 0;
    const isMinimalCategory = !hasTypes && !hasRegulations;
    return {
      category,
      fields,
      types: typesWithKeywords,
      regulations,
      isMinimalCategory
    };
  }
  function createNewCategory(wizardData) {
    if (!wizardData || !wizardData.categoryName) {
      throw new Error("\u30AB\u30C6\u30B4\u30EA\u540D\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const categoryEndpoint = `${supabaseUrl}/rest/v1/categories`;
    const categoryPayload = {
      name: wizardData.categoryName
    };
    const categoryResponse = UrlFetchApp.fetch(categoryEndpoint, {
      method: "post",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(categoryPayload),
      muteHttpExceptions: true
    });
    if (categoryResponse.getResponseCode() !== 201) {
      throw new Error(`\u30AB\u30C6\u30B4\u30EA\u4F5C\u6210\u30A8\u30E9\u30FC: ${categoryResponse.getContentText()}`);
    }
    const createdCategory = JSON.parse(categoryResponse.getContentText())[0];
    const categoryId = createdCategory.id;
    if (wizardData.types && Array.isArray(wizardData.types)) {
      const typesEndpoint = `${supabaseUrl}/rest/v1/types`;
      wizardData.types.forEach((typeData, index) => {
        const typePayload = {
          category_id: categoryId,
          key_name: typeData.key_name,
          display_name: typeData.display_name,
          priority: index + 1,
          is_required: typeData.is_required || false,
          selection_type: typeData.selection_type,
          description: typeData.description || null,
          placeholder: typeData.placeholder || null
        };
        const typeResponse = UrlFetchApp.fetch(typesEndpoint, {
          method: "post",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          payload: JSON.stringify(typePayload),
          muteHttpExceptions: true
        });
        if (typeResponse.getResponseCode() !== 201) {
          throw new Error(`Type\u4F5C\u6210\u30A8\u30E9\u30FC: ${typeResponse.getContentText()}`);
        }
        const createdType = JSON.parse(typeResponse.getContentText())[0];
        const typeId = createdType.id;
        if (typeData.keywords && Array.isArray(typeData.keywords)) {
          const keywordsEndpoint = `${supabaseUrl}/rest/v1/keywords`;
          typeData.keywords.forEach((keywordText, keywordIndex) => {
            const keywordPayload = {
              type_id: typeId,
              keyword: keywordText,
              priority: keywordIndex + 1
            };
            const keywordResponse = UrlFetchApp.fetch(keywordsEndpoint, {
              method: "post",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json"
              },
              payload: JSON.stringify(keywordPayload),
              muteHttpExceptions: true
            });
            if (keywordResponse.getResponseCode() !== 201) {
              Logger.log(`Keyword\u4F5C\u6210\u30A8\u30E9\u30FC\uFF08\u7121\u8996\u3057\u3066\u7D9A\u884C\uFF09: ${keywordResponse.getContentText()}`);
            }
          });
        }
      });
    }
    if (wizardData.regulations && Array.isArray(wizardData.regulations)) {
      const regulationsEndpoint = `${supabaseUrl}/rest/v1/regulations`;
      wizardData.regulations.forEach((regulationData) => {
        const regulationPayload = {
          category_id: categoryId,
          target: regulationData.target,
          pattern_string: regulationData.pattern_string
        };
        const regulationResponse = UrlFetchApp.fetch(regulationsEndpoint, {
          method: "post",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json"
          },
          payload: JSON.stringify(regulationPayload),
          muteHttpExceptions: true
        });
        if (regulationResponse.getResponseCode() !== 201) {
          Logger.log(`Regulation\u4F5C\u6210\u30A8\u30E9\u30FC\uFF08\u7121\u8996\u3057\u3066\u7D9A\u884C\uFF09: ${regulationResponse.getContentText()}`);
        }
      });
    }
    return {
      success: true,
      categoryId,
      message: `\u30AB\u30C6\u30B4\u30EA\u300C${wizardData.categoryName}\u300D\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002`
    };
  }

  // src/api/types.ts
  function addType(categoryId, typeData) {
    if (!categoryId) {
      throw new Error("categoryId\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    if (!typeData || !typeData.key_name || !typeData.display_name || !typeData.selection_type) {
      throw new Error("\u5FC5\u9808\u9805\u76EE\uFF08key_name, display_name, selection_type\uFF09\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const maxPriorityEndpoint = `${supabaseUrl}/rest/v1/types?select=priority&category_id=eq.${categoryId}&order=priority.desc&limit=1`;
    const maxPriorityResponse = UrlFetchApp.fetch(maxPriorityEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    let nextPriority = 1;
    if (maxPriorityResponse.getResponseCode() === 200) {
      const maxPriorityData = JSON.parse(maxPriorityResponse.getContentText());
      if (maxPriorityData.length > 0 && maxPriorityData[0].priority !== null) {
        nextPriority = maxPriorityData[0].priority + 1;
      }
    }
    const endpoint = `${supabaseUrl}/rest/v1/types`;
    const payload = {
      category_id: categoryId,
      key_name: typeData.key_name,
      display_name: typeData.display_name,
      priority: typeData.priority !== void 0 ? typeData.priority : nextPriority,
      is_required: typeData.is_required || false,
      selection_type: typeData.selection_type,
      description: typeData.description || null,
      placeholder: typeData.placeholder || null
    };
    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 201) {
      throw new Error(`Type\u4F5C\u6210\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const createdType = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      type: createdType,
      message: `Type\u300C${typeData.display_name}\u300D\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function updateType(typeObject) {
    if (!typeObject || !typeObject.id) {
      throw new Error("Type ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const updatePayload = {};
    if (typeObject.key_name !== void 0) updatePayload.key_name = typeObject.key_name;
    if (typeObject.display_name !== void 0) updatePayload.display_name = typeObject.display_name;
    if (typeObject.priority !== void 0) updatePayload.priority = typeObject.priority;
    if (typeObject.is_required !== void 0) updatePayload.is_required = typeObject.is_required;
    if (typeObject.selection_type !== void 0) updatePayload.selection_type = typeObject.selection_type;
    if (typeObject.description !== void 0) updatePayload.description = typeObject.description;
    if (typeObject.placeholder !== void 0) updatePayload.placeholder = typeObject.placeholder;
    if (Object.keys(updatePayload).length === 0) {
      throw new Error("\u66F4\u65B0\u3059\u308B\u9805\u76EE\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/types?id=eq.${typeObject.id}`;
    const response = UrlFetchApp.fetch(endpoint, {
      method: "patch",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(`Type\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const updatedType = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      type: updatedType,
      message: `Type\u300C${updatedType.display_name}\u300D\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function deleteType(typeId) {
    if (!typeId) {
      throw new Error("Type ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const getEndpoint = `${supabaseUrl}/rest/v1/types?select=*&id=eq.${typeId}`;
    const getResponse = UrlFetchApp.fetch(getEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (getResponse.getResponseCode() !== 200) {
      throw new Error(`Type\u53D6\u5F97\u30A8\u30E9\u30FC: ${getResponse.getContentText()}`);
    }
    const types = JSON.parse(getResponse.getContentText());
    if (types.length === 0) {
      throw new Error(`\u6307\u5B9A\u3055\u308C\u305FType\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ${typeId}`);
    }
    const typeToDelete = types[0];
    const deleteKeywordsEndpoint = `${supabaseUrl}/rest/v1/keywords?type_id=eq.${typeId}`;
    const deleteKeywordsResponse = UrlFetchApp.fetch(deleteKeywordsEndpoint, {
      method: "delete",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (deleteKeywordsResponse.getResponseCode() !== 204) {
      Logger.log(`Keywords\u524A\u9664\u30A8\u30E9\u30FC\uFF08\u7121\u8996\u3057\u3066\u7D9A\u884C\uFF09: ${deleteKeywordsResponse.getContentText()}`);
    }
    const deleteEndpoint = `${supabaseUrl}/rest/v1/types?id=eq.${typeId}`;
    const deleteResponse = UrlFetchApp.fetch(deleteEndpoint, {
      method: "delete",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (deleteResponse.getResponseCode() !== 204) {
      throw new Error(`Type\u524A\u9664\u30A8\u30E9\u30FC: ${deleteResponse.getContentText()}`);
    }
    return {
      success: true,
      message: `Type\u300C${typeToDelete.display_name}\u300D\u3092\u524A\u9664\u3057\u307E\u3057\u305F\u3002`
    };
  }

  // src/api/keywords.ts
  function addKeyword(typeId, keyword) {
    if (!typeId) {
      throw new Error("typeId\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    if (!keyword) {
      throw new Error("keyword\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const maxPriorityEndpoint = `${supabaseUrl}/rest/v1/keywords?select=priority&type_id=eq.${typeId}&order=priority.desc&limit=1`;
    const maxPriorityResponse = UrlFetchApp.fetch(maxPriorityEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    let nextPriority = 1;
    if (maxPriorityResponse.getResponseCode() === 200) {
      const maxPriorityData = JSON.parse(maxPriorityResponse.getContentText());
      if (maxPriorityData.length > 0 && maxPriorityData[0].priority !== null) {
        nextPriority = maxPriorityData[0].priority + 1;
      }
    }
    let keywordText;
    let priority;
    if (typeof keyword === "string") {
      keywordText = keyword;
      priority = nextPriority;
    } else {
      keywordText = keyword.keyword;
      priority = keyword.priority !== void 0 ? keyword.priority : nextPriority;
    }
    const endpoint = `${supabaseUrl}/rest/v1/keywords`;
    const payload = {
      type_id: typeId,
      keyword: keywordText,
      priority
    };
    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 201) {
      throw new Error(`Keyword\u4F5C\u6210\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const createdKeyword = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      keyword: createdKeyword,
      message: `Keyword\u300C${keywordText}\u300D\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function updateKeyword(keywordData) {
    if (!keywordData || !keywordData.id) {
      throw new Error("Keyword ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const updatePayload = {};
    if (keywordData.keyword !== void 0) updatePayload.keyword = keywordData.keyword;
    if (keywordData.priority !== void 0) updatePayload.priority = keywordData.priority;
    if (Object.keys(updatePayload).length === 0) {
      throw new Error("\u66F4\u65B0\u3059\u308B\u9805\u76EE\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/keywords?id=eq.${keywordData.id}`;
    const response = UrlFetchApp.fetch(endpoint, {
      method: "patch",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(`Keyword\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const updatedKeyword = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      keyword: updatedKeyword,
      message: `Keyword\u300C${updatedKeyword.keyword}\u300D\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function deleteKeyword(payload) {
    let keywordId;
    if (typeof payload === "string") {
      keywordId = payload;
    } else if (payload && payload.id) {
      keywordId = payload.id;
    } else {
      throw new Error("Keyword ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const getEndpoint = `${supabaseUrl}/rest/v1/keywords?select=*&id=eq.${keywordId}`;
    const getResponse = UrlFetchApp.fetch(getEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (getResponse.getResponseCode() !== 200) {
      throw new Error(`Keyword\u53D6\u5F97\u30A8\u30E9\u30FC: ${getResponse.getContentText()}`);
    }
    const keywords = JSON.parse(getResponse.getContentText());
    if (keywords.length === 0) {
      throw new Error(`\u6307\u5B9A\u3055\u308C\u305FKeyword\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ${keywordId}`);
    }
    const keywordToDelete = keywords[0];
    const deleteEndpoint = `${supabaseUrl}/rest/v1/keywords?id=eq.${keywordId}`;
    const deleteResponse = UrlFetchApp.fetch(deleteEndpoint, {
      method: "delete",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (deleteResponse.getResponseCode() !== 204) {
      throw new Error(`Keyword\u524A\u9664\u30A8\u30E9\u30FC: ${deleteResponse.getContentText()}`);
    }
    return {
      success: true,
      message: `Keyword\u300C${keywordToDelete.keyword}\u300D\u3092\u524A\u9664\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function updateKeywordsPriority(typeId, updates) {
    if (!typeId) {
      throw new Error("typeId\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      throw new Error("\u66F4\u65B0\u30C7\u30FC\u30BF\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const results = [];
    for (const update of updates) {
      if (!update.id || update.priority === void 0) {
        throw new Error("ID\u307E\u305F\u306F\u512A\u5148\u9806\u4F4D\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
      }
      const endpoint = `${supabaseUrl}/rest/v1/keywords?id=eq.${update.id}`;
      const payload = {
        priority: update.priority
      };
      const response = UrlFetchApp.fetch(endpoint, {
        method: "patch",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      if (response.getResponseCode() !== 200) {
        throw new Error(`Keyword\u512A\u5148\u9806\u4F4D\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
      }
      const updatedKeyword = JSON.parse(response.getContentText())[0];
      results.push(updatedKeyword);
    }
    return {
      success: true,
      keywords: results,
      message: `${results.length}\u500B\u306E\u30AD\u30FC\u30EF\u30FC\u30C9\u306E\u512A\u5148\u9806\u4F4D\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002`
    };
  }

  // src/api/regulations.ts
  function updateRegulation(regulationObject) {
    if (!regulationObject || !regulationObject.id) {
      throw new Error("Regulation ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const updatePayload = {};
    if (regulationObject.target !== void 0) updatePayload.target = regulationObject.target;
    if (regulationObject.pattern_string !== void 0) updatePayload.pattern_string = regulationObject.pattern_string;
    if (Object.keys(updatePayload).length === 0) {
      throw new Error("\u66F4\u65B0\u3059\u308B\u9805\u76EE\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/regulations?id=eq.${regulationObject.id}`;
    const response = UrlFetchApp.fetch(endpoint, {
      method: "patch",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(`Regulation\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const updatedRegulation = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      regulation: updatedRegulation,
      message: `Regulation\u300C${updatedRegulation.target}\u300D\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002`
    };
  }

  // src/api/ngwords.ts
  function getNgWords() {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*&order=created_at.asc`;
    const response = UrlFetchApp.fetch(endpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(`NG\u30EF\u30FC\u30C9\u53D6\u5F97\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    return JSON.parse(response.getContentText());
  }
  function addNgWord(word, reason) {
    if (!word) {
      throw new Error("\u7981\u6B62\u30EF\u30FC\u30C9\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/prohibited_words`;
    const payload = {
      word,
      reason: reason || null
    };
    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 201) {
      throw new Error(`NG\u30EF\u30FC\u30C9\u8FFD\u52A0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const createdNgWord = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      ngWord: createdNgWord,
      message: `NG\u30EF\u30FC\u30C9\u300C${word}\u300D\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function updateNgWord(id, word, reason) {
    if (!id) {
      throw new Error("NG\u30EF\u30FC\u30C9ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    if (!word) {
      throw new Error("\u7981\u6B62\u30EF\u30FC\u30C9\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const endpoint = `${supabaseUrl}/rest/v1/prohibited_words?id=eq.${id}`;
    const payload = {
      word,
      reason: reason !== void 0 ? reason : null
    };
    const response = UrlFetchApp.fetch(endpoint, {
      method: "patch",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(`NG\u30EF\u30FC\u30C9\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const updatedNgWord = JSON.parse(response.getContentText())[0];
    return {
      success: true,
      ngWord: updatedNgWord,
      message: `NG\u30EF\u30FC\u30C9\u300C${word}\u300D\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002`
    };
  }
  function deleteNgWord(id) {
    if (!id) {
      throw new Error("NG\u30EF\u30FC\u30C9ID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const getEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*&id=eq.${id}`;
    const getResponse = UrlFetchApp.fetch(getEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (getResponse.getResponseCode() !== 200) {
      throw new Error(`NG\u30EF\u30FC\u30C9\u53D6\u5F97\u30A8\u30E9\u30FC: ${getResponse.getContentText()}`);
    }
    const ngWords = JSON.parse(getResponse.getContentText());
    if (ngWords.length === 0) {
      throw new Error(`\u6307\u5B9A\u3055\u308C\u305FNG\u30EF\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ${id}`);
    }
    const ngWordToDelete = ngWords[0];
    const deleteEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?id=eq.${id}`;
    const deleteResponse = UrlFetchApp.fetch(deleteEndpoint, {
      method: "delete",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (deleteResponse.getResponseCode() !== 204) {
      throw new Error(`NG\u30EF\u30FC\u30C9\u524A\u9664\u30A8\u30E9\u30FC: ${deleteResponse.getContentText()}`);
    }
    return {
      success: true,
      message: `NG\u30EF\u30FC\u30C9\u300C${ngWordToDelete.word}\u300D\u3092\u524A\u9664\u3057\u307E\u3057\u305F\u3002`
    };
  }

  // src/api/naming.ts
  function generateNames(formData) {
    if (!formData || !formData.categoryId) {
      throw new Error("\u30AB\u30C6\u30B4\u30EAID\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const regulationsEndpoint = `${supabaseUrl}/rest/v1/regulations?select=*&category_id=eq.${formData.categoryId}`;
    const regulationsResponse = UrlFetchApp.fetch(regulationsEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    if (regulationsResponse.getResponseCode() !== 200) {
      throw new Error(`Regulations\u53D6\u5F97\u30A8\u30E9\u30FC: ${regulationsResponse.getContentText()}`);
    }
    const regulations = JSON.parse(regulationsResponse.getContentText());
    const replacementData = {};
    if (formData.fields) {
      Object.keys(formData.fields).forEach((key) => {
        replacementData[key] = formData.fields[key] || "";
      });
    }
    if (formData.types) {
      Object.keys(formData.types).forEach((keyName) => {
        replacementData[keyName] = formData.types[keyName] || "";
      });
    }
    let productPageName = "";
    let productName = "";
    regulations.forEach((regulation) => {
      let result = regulation.pattern_string;
      Object.keys(replacementData).forEach((key) => {
        const placeholder = `{${key}}`;
        const value = replacementData[key] || "";
        result = result.split(placeholder).join(value);
      });
      result = result.replace(/\{[^}]+\}/g, "");
      result = result.replace(/\s+/g, " ").trim();
      if (regulation.target === "\u30AD\u30E3\u30C3\u30C1\u30B3\u30D4\u30FC") {
        productPageName = result;
      } else if (regulation.target === "\u5546\u54C1\u540D") {
        productName = result;
      }
    });
    const ngWordsEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*`;
    const ngWordsResponse = UrlFetchApp.fetch(ngWordsEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    let prohibitedWordsFound = [];
    if (ngWordsResponse.getResponseCode() === 200) {
      const ngWords = JSON.parse(ngWordsResponse.getContentText());
      ngWords.forEach((ngWord) => {
        if (productPageName.includes(ngWord.word)) {
          prohibitedWordsFound.push({
            word: ngWord.word,
            reason: ngWord.reason,
            target: "productPageName"
          });
        }
        if (productName.includes(ngWord.word)) {
          prohibitedWordsFound.push({
            word: ngWord.word,
            reason: ngWord.reason,
            target: "productName"
          });
        }
      });
    }
    return {
      productPageName,
      productName,
      prohibitedWordsFound,
      characterCounts: {
        productPageName: productPageName.length,
        productName: productName.length
      }
    };
  }
  function generateNamesMinimal(inputData) {
    if (!inputData) {
      throw new Error("\u5165\u529B\u30C7\u30FC\u30BF\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
    }
    const productPageName = inputData.catchcopy || "";
    const productName = inputData.productname || "";
    const ngWordsEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*`;
    const ngWordsResponse = UrlFetchApp.fetch(ngWordsEndpoint, {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });
    let prohibitedWordsFound = [];
    if (ngWordsResponse.getResponseCode() === 200) {
      const ngWords = JSON.parse(ngWordsResponse.getContentText());
      ngWords.forEach((ngWord) => {
        if (productPageName.includes(ngWord.word)) {
          prohibitedWordsFound.push({
            word: ngWord.word,
            reason: ngWord.reason,
            target: "productPageName"
          });
        }
        if (productName.includes(ngWord.word)) {
          prohibitedWordsFound.push({
            word: ngWord.word,
            reason: ngWord.reason,
            target: "productName"
          });
        }
      });
    }
    return {
      productPageName,
      productName,
      prohibitedWordsFound,
      characterCounts: {
        productPageName: productPageName.length,
        productName: productName.length
      }
    };
  }

  // src/api/auth.ts
  function loginWithPassword(email, password) {
    Logger.log(`[loginWithPassword] email=${email}`);
    if (!email || !password) {
      return { error: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u3068\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" };
    }
    try {
      const props = PropertiesService.getScriptProperties();
      const supabaseUrl = props.getProperty("SUPABASE_URL");
      const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseKey) {
        Logger.log("[loginWithPassword] \u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        return { error: "\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" };
      }
      const endpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;
      const options = {
        method: "get",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        muteHttpExceptions: true
      };
      const response = UrlFetchApp.fetch(endpoint, options);
      if (response.getResponseCode() !== 200) {
        Logger.log(`[loginWithPassword] DB\u691C\u7D22\u30A8\u30E9\u30FC: ${response.getContentText()}`);
        return { error: "\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" };
      }
      const users = JSON.parse(response.getContentText());
      if (users.length === 0) {
        Logger.log("[loginWithPassword] \u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
        return { error: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" };
      }
      const user = users[0];
      if (!user.password_hash || !user.salt) {
        Logger.log("[loginWithPassword] \u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        return { error: "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u7BA1\u7406\u8005\u306B\u9023\u7D61\u3057\u3066\u304F\u3060\u3055\u3044\u3002" };
      }
      const isValid = verifyPassword(password, user.salt, user.password_hash);
      if (!isValid) {
        Logger.log("[loginWithPassword] \u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093");
        return { error: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" };
      }
      createSession(user);
      Logger.log("[loginWithPassword] \u30ED\u30B0\u30A4\u30F3\u6210\u529F");
      const { password_hash, salt, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      Logger.log(`[loginWithPassword] \u30A8\u30E9\u30FC: ${error}`);
      return { error: "\u30ED\u30B0\u30A4\u30F3\u51E6\u7406\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" };
    }
  }
  function getCurrentUser() {
    const cache = CacheService.getUserCache();
    const sessionData = cache.get("user_session");
    Logger.log(`[getCurrentUser] \u30BB\u30C3\u30B7\u30E7\u30F3\u30C7\u30FC\u30BF: ${sessionData}`);
    if (!sessionData) {
      Logger.log("[getCurrentUser] \u30BB\u30C3\u30B7\u30E7\u30F3\u30C7\u30FC\u30BF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
      return null;
    }
    try {
      const parsed = JSON.parse(sessionData);
      Logger.log(`[getCurrentUser] \u30D1\u30FC\u30B9\u6E08\u307F\u30C7\u30FC\u30BF: ${JSON.stringify(parsed)}`);
      return parsed;
    } catch (error) {
      Logger.log(`\u30BB\u30C3\u30B7\u30E7\u30F3\u30C7\u30FC\u30BF\u306E\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC: ${error}`);
      return null;
    }
  }
  function createSession(user) {
    Logger.log(`[createSession] \u30E6\u30FC\u30B6\u30FC: ${JSON.stringify(user)}`);
    const sessionData = {
      userId: user.id,
      email: user.email,
      userName: user.user_name,
      role: user.role
    };
    Logger.log(`[createSession] \u30BB\u30C3\u30B7\u30E7\u30F3\u30C7\u30FC\u30BF: ${JSON.stringify(sessionData)}`);
    const cache = CacheService.getUserCache();
    cache.put("user_session", JSON.stringify(sessionData), 21600);
    Logger.log("[createSession] \u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F");
  }
  function logout() {
    const cache = CacheService.getUserCache();
    cache.remove("user_session");
    Logger.log("[logout] \u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3057\u307E\u3057\u305F");
  }
  function getUserRole() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Logger.log("[getUserRole] \u672A\u30ED\u30B0\u30A4\u30F3\uFF1Anull\u3092\u8FD4\u3057\u307E\u3059");
      return null;
    }
    Logger.log(`[getUserRole] \u73FE\u5728\u306E\u30E6\u30FC\u30B6\u30FC: role=${currentUser.role}, email=${currentUser.email}`);
    return currentUser.role;
  }
  function hasRole(requiredRole) {
    Logger.log(`[hasRole] \u30C1\u30A7\u30C3\u30AF\u4E2D... requiredRole=${requiredRole}`);
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Logger.log("[hasRole] \u672A\u30ED\u30B0\u30A4\u30F3\uFF1Afalse\u3092\u8FD4\u3057\u307E\u3059");
      return false;
    }
    Logger.log(`[hasRole] \u73FE\u5728\u306E\u30E6\u30FC\u30B6\u30FC: role=${currentUser.role}, email=${currentUser.email}`);
    if (currentUser.role === "admin") {
      Logger.log(`[hasRole] admin\u30E6\u30FC\u30B6\u30FC\u306A\u306E\u3067true\u3092\u8FD4\u3057\u307E\u3059`);
      return true;
    }
    const result = requiredRole === "user";
    Logger.log(`[hasRole] user\u30ED\u30FC\u30EB: requiredRole=${requiredRole}, result=${result}`);
    return result;
  }

  // src/api/users.ts
  function registerUser(email, password, userName) {
    if (!email || !password || !userName) {
      return { error: "\u3059\u3079\u3066\u306E\u9805\u76EE\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" };
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return { error: passwordError };
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return { error: "\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" };
    }
    try {
      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const endpoint = `${supabaseUrl}/rest/v1/app_users`;
      const payload = {
        email,
        user_name: userName,
        role: "user",
        // デフォルトはuserロール
        password_hash: passwordHash,
        salt
      };
      const options = {
        method: "post",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
          // 挿入したデータを返す
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      const response = UrlFetchApp.fetch(endpoint, options);
      if (response.getResponseCode() !== 201) {
        const errorText = response.getContentText();
        if (errorText.includes("duplicate key") || errorText.includes("unique constraint")) {
          return { error: "\u3053\u306E\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306F\u65E2\u306B\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u3059" };
        }
        Logger.log(`\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u30A8\u30E9\u30FC: ${errorText}`);
        return { error: "\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" };
      }
      const users = JSON.parse(response.getContentText());
      const user = users[0];
      const { password_hash, salt: userSalt, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      Logger.log(`\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u30A8\u30E9\u30FC: ${error}`);
      return { error: "\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F" };
    }
  }
  function getUserByEmail(email) {
    if (!email) {
      throw new Error("email\u306F\u5FC5\u9808\u3067\u3059");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const endpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;
    const options = {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`\u30E6\u30FC\u30B6\u30FC\u691C\u7D22\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const users = JSON.parse(response.getContentText());
    return users.length > 0 ? users[0] : null;
  }
  function getUserById(userId) {
    if (!userId) {
      throw new Error("userId\u306F\u5FC5\u9808\u3067\u3059");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}&limit=1`;
    const options = {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`\u30E6\u30FC\u30B6\u30FC\u691C\u7D22\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const users = JSON.parse(response.getContentText());
    return users.length > 0 ? users[0] : null;
  }
  function updateUserRole(userId, newRole) {
    if (!userId || !newRole) {
      throw new Error("userId\u3068newRole\u306F\u5FC5\u9808\u3067\u3059");
    }
    if (newRole !== "admin" && newRole !== "user") {
      throw new Error('role\u306F"admin"\u307E\u305F\u306F"user"\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059');
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`;
    const payload = {
      role: newRole
    };
    const options = {
      method: "patch",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`\u30ED\u30FC\u30EB\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const users = JSON.parse(response.getContentText());
    if (users.length === 0) {
      throw new Error("\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
    }
    return users[0];
  }
  function updateUserName(userId, newUserName) {
    if (!userId || !newUserName) {
      throw new Error("userId\u3068newUserName\u306F\u5FC5\u9808\u3067\u3059");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`;
    const payload = {
      user_name: newUserName
    };
    const options = {
      method: "patch",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`\u30E6\u30FC\u30B6\u30FC\u540D\u66F4\u65B0\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    const users = JSON.parse(response.getContentText());
    if (users.length === 0) {
      throw new Error("\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
    }
    return users[0];
  }
  function listUsers() {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const endpoint = `${supabaseUrl}/rest/v1/app_users?select=*&order=created_at.desc`;
    const options = {
      method: "get",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`\u30E6\u30FC\u30B6\u30FC\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
    return JSON.parse(response.getContentText());
  }
  function deleteUser(userId) {
    if (!userId) {
      throw new Error("userId\u306F\u5FC5\u9808\u3067\u3059");
    }
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty("SUPABASE_URL");
    const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("\u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`;
    const options = {
      method: "delete",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(endpoint, options);
    if (response.getResponseCode() !== 204 && response.getResponseCode() !== 200) {
      throw new Error(`\u30E6\u30FC\u30B6\u30FC\u524A\u9664\u30A8\u30E9\u30FC: ${response.getContentText()}`);
    }
  }

  // src/lib/utils.ts
  function generateSalt2() {
    const randomBytes = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
    return randomBytes.substring(0, 64);
  }
  function hashPassword2(password, salt) {
    const combined = password + salt;
    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      combined,
      Utilities.Charset.UTF_8
    );
    return digest.map((byte) => {
      const hex = (byte < 0 ? byte + 256 : byte).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function verifyPassword2(password, salt, storedHash) {
    const hash = hashPassword2(password, salt);
    return hash === storedHash;
  }
  function validatePasswordStrength2(password) {
    if (!password || password.length < 8) {
      return "\u30D1\u30B9\u30EF\u30FC\u30C9\u306F8\u6587\u5B57\u4EE5\u4E0A\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044";
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return "\u30D1\u30B9\u30EF\u30FC\u30C9\u306F\u82F1\u5B57\u3068\u6570\u5B57\u306E\u4E21\u65B9\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059";
    }
    return null;
  }

  // src/scripts/setAdminPassword.ts
  function setAdminPassword() {
    const email = "nishimoto.kakeru@vega-c.com";
    const password = "YOUR_PASSWORD_HERE";
    if (password === "YOUR_PASSWORD_HERE") {
      Logger.log("\u30A8\u30E9\u30FC: \u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
      Logger.log("\u30B9\u30AF\u30EA\u30D7\u30C8\u3092\u7DE8\u96C6\u3057\u3066\u3001password\u3092\u5B9F\u969B\u306E\u5024\u306B\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044");
      return;
    }
    Logger.log(`[setAdminPassword] \u30E1\u30FC\u30EB: ${email}`);
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      Logger.log(`\u30A8\u30E9\u30FC: ${passwordError}`);
      return;
    }
    try {
      const props = PropertiesService.getScriptProperties();
      const supabaseUrl = props.getProperty("SUPABASE_URL");
      const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseKey) {
        Logger.log("\u30A8\u30E9\u30FC: \u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        return;
      }
      const getUserEndpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;
      const getUserOptions = {
        method: "get",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        muteHttpExceptions: true
      };
      const getUserResponse = UrlFetchApp.fetch(getUserEndpoint, getUserOptions);
      if (getUserResponse.getResponseCode() !== 200) {
        Logger.log(`\u30A8\u30E9\u30FC: \u30E6\u30FC\u30B6\u30FC\u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F - ${getUserResponse.getContentText()}`);
        return;
      }
      const users = JSON.parse(getUserResponse.getContentText());
      if (users.length === 0) {
        Logger.log(`\u30A8\u30E9\u30FC: \u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9 ${email} \u306E\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`);
        return;
      }
      const user = users[0];
      Logger.log(`\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F: ${user.user_name} (${user.email}), role=${user.role}`);
      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const updateEndpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${user.id}`;
      const updatePayload = {
        password_hash: passwordHash,
        salt
      };
      const updateOptions = {
        method: "patch",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        payload: JSON.stringify(updatePayload),
        muteHttpExceptions: true
      };
      const updateResponse = UrlFetchApp.fetch(updateEndpoint, updateOptions);
      if (updateResponse.getResponseCode() !== 204) {
        Logger.log(`\u30A8\u30E9\u30FC: \u30D1\u30B9\u30EF\u30FC\u30C9\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F - ${updateResponse.getContentText()}`);
        return;
      }
      Logger.log("\u2705 \u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u6B63\u5E38\u306B\u8A2D\u5B9A\u3057\u307E\u3057\u305F");
      Logger.log("\u3053\u306E\u30D1\u30B9\u30EF\u30FC\u30C9\u3067\u30ED\u30B0\u30A4\u30F3\u3067\u304D\u307E\u3059");
    } catch (error) {
      Logger.log(`\u30A8\u30E9\u30FC: ${error}`);
    }
  }
  function setUserPassword(email, newPassword) {
    if (!email || !newPassword) {
      Logger.log("\u30A8\u30E9\u30FC: email\u3068newPassword\u306F\u5FC5\u9808\u3067\u3059");
      return;
    }
    Logger.log(`[setUserPassword] \u30E1\u30FC\u30EB: ${email}`);
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      Logger.log(`\u30A8\u30E9\u30FC: ${passwordError}`);
      return;
    }
    try {
      const props = PropertiesService.getScriptProperties();
      const supabaseUrl = props.getProperty("SUPABASE_URL");
      const supabaseKey = props.getProperty("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseKey) {
        Logger.log("\u30A8\u30E9\u30FC: \u74B0\u5883\u5909\u6570\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093");
        return;
      }
      const getUserEndpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;
      const getUserOptions = {
        method: "get",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        muteHttpExceptions: true
      };
      const getUserResponse = UrlFetchApp.fetch(getUserEndpoint, getUserOptions);
      if (getUserResponse.getResponseCode() !== 200) {
        Logger.log(`\u30A8\u30E9\u30FC: \u30E6\u30FC\u30B6\u30FC\u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F - ${getUserResponse.getContentText()}`);
        return;
      }
      const users = JSON.parse(getUserResponse.getContentText());
      if (users.length === 0) {
        Logger.log(`\u30A8\u30E9\u30FC: \u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9 ${email} \u306E\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`);
        return;
      }
      const user = users[0];
      Logger.log(`\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F: ${user.user_name} (${user.email}), role=${user.role}`);
      const salt = generateSalt();
      const passwordHash = hashPassword(newPassword, salt);
      const updateEndpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${user.id}`;
      const updatePayload = {
        password_hash: passwordHash,
        salt
      };
      const updateOptions = {
        method: "patch",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        payload: JSON.stringify(updatePayload),
        muteHttpExceptions: true
      };
      const updateResponse = UrlFetchApp.fetch(updateEndpoint, updateOptions);
      if (updateResponse.getResponseCode() !== 204) {
        Logger.log(`\u30A8\u30E9\u30FC: \u30D1\u30B9\u30EF\u30FC\u30C9\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F - ${updateResponse.getContentText()}`);
        return;
      }
      Logger.log("\u2705 \u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u6B63\u5E38\u306B\u8A2D\u5B9A\u3057\u307E\u3057\u305F");
      Logger.log(`${user.user_name} (${user.email}) \u306E\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F`);
    } catch (error) {
      Logger.log(`\u30A8\u30E9\u30FC: ${error}`);
    }
  }

  // src/index.ts
  var doGet = (e) => {
    return HtmlService.createHtmlOutputFromFile("index").setTitle("LOWYA\u5546\u54C1\u547D\u540D\u30A2\u30D7\u30EA").addMetaTag("viewport", "width=device-width, initial-scale=1");
  };
  global.doGet = doGet;
  var getEnvironmentVariables = () => {
    const props = PropertiesService.getScriptProperties();
    return {
      supabaseUrl: props.getProperty("SUPABASE_URL") || "",
      // NOTE: フロントエンドにはanon keyのみを渡す（service role keyは渡さない）
      supabaseAnonKey: props.getProperty("SUPABASE_ANON_KEY") || ""
    };
  };
  global.getEnvironmentVariables = getEnvironmentVariables;
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
  global.getCategories = getCategories;
  global.getParentCategories = getParentCategories;
  global.getSchemaForCategory = getSchemaForCategory;
  global.createNewCategory = createNewCategory;
  global.addType = addType;
  global.updateType = updateType;
  global.deleteType = deleteType;
  global.addKeyword = addKeyword;
  global.updateKeyword = updateKeyword;
  global.deleteKeyword = deleteKeyword;
  global.updateKeywordsPriority = updateKeywordsPriority;
  global.updateRegulation = updateRegulation;
  global.getNgWords = getNgWords;
  global.addNgWord = addNgWord;
  global.updateNgWord = updateNgWord;
  global.deleteNgWord = deleteNgWord;
  global.generateNames = generateNames;
  global.generateNamesMinimal = generateNamesMinimal;
  global.loginWithPassword = loginWithPassword;
  global.getCurrentUser = getCurrentUser;
  global.getUserRole = getUserRole;
  global.createSession = createSession;
  global.logout = logout;
  global.hasRole = hasRole;
  global.registerUser = registerUser;
  global.getUserByEmail = getUserByEmail;
  global.getUserById = getUserById;
  global.updateUserRole = updateUserRole;
  global.updateUserName = updateUserName;
  global.listUsers = listUsers;
  global.deleteUser = deleteUser;
  global.setAdminPassword = setAdminPassword;
  global.setUserPassword = setUserPassword;
  global.generateSalt = generateSalt2;
  global.hashPassword = hashPassword2;
  global.verifyPassword = verifyPassword2;
  global.validatePasswordStrength = validatePasswordStrength2;
})();

function doGet() { return global.doGet.apply(this, arguments); }
function getEnvironmentVariables() { return global.getEnvironmentVariables.apply(this, arguments); }
function testSupabaseConnection() { return global.testSupabaseConnection.apply(this, arguments); }
function getCategories() { return global.getCategories.apply(this, arguments); }
function getParentCategories() { return global.getParentCategories.apply(this, arguments); }
function getSchemaForCategory() { return global.getSchemaForCategory.apply(this, arguments); }
function createNewCategory() { return global.createNewCategory.apply(this, arguments); }
function addType() { return global.addType.apply(this, arguments); }
function updateType() { return global.updateType.apply(this, arguments); }
function deleteType() { return global.deleteType.apply(this, arguments); }
function addKeyword() { return global.addKeyword.apply(this, arguments); }
function updateKeyword() { return global.updateKeyword.apply(this, arguments); }
function deleteKeyword() { return global.deleteKeyword.apply(this, arguments); }
function updateKeywordsPriority() { return global.updateKeywordsPriority.apply(this, arguments); }
function updateRegulation() { return global.updateRegulation.apply(this, arguments); }
function getNgWords() { return global.getNgWords.apply(this, arguments); }
function addNgWord() { return global.addNgWord.apply(this, arguments); }
function updateNgWord() { return global.updateNgWord.apply(this, arguments); }
function deleteNgWord() { return global.deleteNgWord.apply(this, arguments); }
function generateNames() { return global.generateNames.apply(this, arguments); }
function generateNamesMinimal() { return global.generateNamesMinimal.apply(this, arguments); }
function loginWithPassword() { return global.loginWithPassword.apply(this, arguments); }
function getCurrentUser() { return global.getCurrentUser.apply(this, arguments); }
function getUserRole() { return global.getUserRole.apply(this, arguments); }
function createSession() { return global.createSession.apply(this, arguments); }
function logout() { return global.logout.apply(this, arguments); }
function hasRole() { return global.hasRole.apply(this, arguments); }
function registerUser() { return global.registerUser.apply(this, arguments); }
function getUserByEmail() { return global.getUserByEmail.apply(this, arguments); }
function getUserById() { return global.getUserById.apply(this, arguments); }
function updateUserRole() { return global.updateUserRole.apply(this, arguments); }
function updateUserName() { return global.updateUserName.apply(this, arguments); }
function listUsers() { return global.listUsers.apply(this, arguments); }
function deleteUser() { return global.deleteUser.apply(this, arguments); }
function setAdminPassword() { return global.setAdminPassword.apply(this, arguments); }
function setUserPassword() { return global.setUserPassword.apply(this, arguments); }
function generateSalt() { return global.generateSalt.apply(this, arguments); }
function hashPassword() { return global.hashPassword.apply(this, arguments); }
function verifyPassword() { return global.verifyPassword.apply(this, arguments); }
function validatePasswordStrength() { return global.validatePasswordStrength.apply(this, arguments); }