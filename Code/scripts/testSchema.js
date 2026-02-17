const supa = require('../server/db');

async function testSchema() {
  try {
    const { data, error } = await supa.rpc('get_table_schema_json', {
      table_name: 'usuarios',
    });
    if (error) {
      const { data: cols, error: errCols } = await supa
        .from('usuarios')
        .select()
        .limit(0);
      if (errCols) {
        console.error('Error fetching columns:', errCols);
      } else {
        console.log(
          'Columns fetched (empty row keys):',
          Object.keys(cols[0] || {}),
        );
      }
    } else {
      console.log('Schema:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Test schema error:', err.message);
  }
}

async function testInsertDirect() {
  try {
    console.log('Test indirect insert check...');
    const testId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supa.from('usuarios').insert([
      {
        id: testId,
        nombre_completo: 'Test Schema',
        correo_electronico: 'schema.test@example.com',
        rol: 'cliente',
      },
    ]);

    console.log(
      'Manual insert result error:',
      error ? error.message : 'No error (unexpected)',
    );
  } catch (err) {
    console.error('Manual insert catch:', err.message);
  }
}

testInsertDirect();
