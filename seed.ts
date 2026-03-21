// seed.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

// .envファイルを読み込む
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません。');
  process.exit(1);
}

// 権限を無視して全操作が可能な特権クライアントを作成
const supabase = createClient(supabaseUrl, supabaseKey);

// ✨ 修正ポイント: 返り値を any[] と明示することで unknown エラーを回避
const readCsv = (fileName: string): any[] => {
  const filePath = path.join(__dirname, 'data', fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parse(fileContent, { columns: true, skip_empty_lines: true });
};

const main = async () => {
  console.log('🚀 データ移行を開始します...\n');

  try {
    // 古いIDと新しいUUIDの対応表（辞書）
    const categoryMap: Record<string, string> = {};
    const typeMap: Record<string, string> = {};

    // --------------------------------------------------
    // 1. Categories の移行
    // --------------------------------------------------
    console.log('📦 Categoriesを挿入中...');
    const categories = readCsv('Categories.csv');
    for (const row of categories) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: row.CategoryName })
        .select()
        .single();

      if (error) throw error;
      categoryMap[row.CategoryID] = data.id;
    }

    // --------------------------------------------------
    // 2. Types の移行
    // --------------------------------------------------
    console.log('📦 Typesを挿入中...');
    const types = readCsv('Types.csv');
    for (const row of types) {
      const { data, error } = await supabase
        .from('types')
        .insert({
          category_id: categoryMap[row.CategoryID],
          key_name: row.Type,
          display_name: row.Type,
          priority: parseInt(row.Priority || '0', 10),
          is_required: row.IsRequired.toUpperCase() === 'TRUE',
          selection_type: row.SelectionType,
          description: row.Description || null,
          placeholder: row.Placeholder || null,
        })
        .select()
        .single();

      if (error) throw error;
      typeMap[row.TypeID] = data.id;
    }

    // --------------------------------------------------
    // 3. Keywords の移行
    // --------------------------------------------------
    console.log('📦 Keywordsを挿入中...');
    const keywords = readCsv('Keywords.csv');
    for (const row of keywords) {
      const { error } = await supabase
        .from('keywords')
        .insert({
          type_id: typeMap[row.TypeID],
          keyword: row.Keyword,
          priority: parseInt(row.Priority || '0', 10),
        });
      if (error) throw error;
    }

    // --------------------------------------------------
    // 4. Regulations の移行
    // --------------------------------------------------
    console.log('📦 Regulationsを挿入中...');
    const regulations = readCsv('Regulations.csv');
    for (const row of regulations) {
      const { error } = await supabase
        .from('regulations')
        .insert({
          category_id: categoryMap[row.CategoryID],
          target: row.Target,
          pattern_string: row.PatternString,
        });
      if (error) throw error;
    }

    // --------------------------------------------------
    // 5. Fields の移行
    // --------------------------------------------------
    console.log('📦 Fieldsを挿入中...');
    const fields = readCsv('Fields.csv');
    for (const row of fields) {
      const { error } = await supabase
        .from('fields')
        .insert({
          field_key: row.FieldID,
          display_name: row.DisplayName,
          input_type: row.InputType,
          priority: parseInt(row.Priority || '0', 10),
          placeholder: row.Placeholder || null,
        });
      if (error) throw error;
    }

    // --------------------------------------------------
    // 6. ProhibitedWords の移行
    // --------------------------------------------------
    console.log('📦 ProhibitedWordsを挿入中...');
    const prohibited = readCsv('ProhibitedWords.csv');
    for (const row of prohibited) {
      const { error } = await supabase
        .from('prohibited_words')
        .insert({
          word: row.Word,
          reason: row.Reason || null,
        });
      if (error) throw error;
    }

    console.log('\n🎉 すべてのデータ移行が完了しました！');
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
  }
};

main();