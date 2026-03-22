import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read Excel file
const filePath = 'C:\\Users\\Jehoshua Pelingon\\Downloads\\FOR-pcc-students.xlsx';
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = xlsx.utils.sheet_to_json(ws);

console.log(`Total rows in Excel: ${excelData.length}`);

// Parse date from Excel serial number
function parseExcelDate(dateValue) {
  if (typeof dateValue === 'string') {
    // Try to parse string dates like "11/22/2023"
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }
  } else if (typeof dateValue === 'number') {
    // Excel date serial number (days since 1/1/1900)
    const excelEpoch = new Date(1900, 0, 1);
    return new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
  }
  return null;
}

// Group data by RSBSA code to handle multiple commodities per farmer
const farmersByRsbsa = new Map();

excelData.forEach((row) => {
  const rsbsaCode = row['RSBSA CODE']?.trim();
  if (!rsbsaCode) return;

  if (!farmersByRsbsa.has(rsbsaCode)) {
    const firstName = row['FIRST NAME']?.trim() || '';
    const lastName = row['LAST NAME']?.trim() || '';
    const middleName = row['MIDDLE NAME']?.trim() || undefined;
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();

    farmersByRsbsa.set(rsbsaCode, {
      rsbsaCode: rsbsaCode,
      lastName: lastName,
      firstName: firstName,
      middleName: middleName || undefined,
      fullName: fullName,
      gender: row['GENDER']?.trim() || undefined,
      birthdate: parseExcelDate(row['BIRTHDATE']),
      isFarmer: row['FARMER']?.trim().toUpperCase() === 'YES',
      isFarmworker: row['FARMWORKER']?.trim().toUpperCase() === 'YES',
      isFisherfolk: row['FISHERFOLK']?.trim().toUpperCase() === 'YES',
      isAgriyouth: row['AGRIYOUTH']?.trim().toUpperCase() === 'YES',
      isIndigenousPeople: row['IF IP']?.trim().toUpperCase() === 'YES',
      isOrganicPractitioner: row['ORGANIC PRACTITIONERS'] > 0,
      isArb: row['ARB']?.trim().toUpperCase() === 'YES',
      // FARMER ADDRESS = Barangay, Municipality, Province
      farmerAddress1: row['FARMER ADDRESS 1']?.trim() || undefined,  // BARANGAY
      farmerAddress2: row['FARMER ADDRESS 2']?.trim() || undefined,  // MUNICIPALITY
      farmerAddress3: row['FARMER ADDRESS 3']?.trim() || undefined,  // PROVINCE
      parcelNo: row['PARCEL NO'],
      // PARCEL ADDRESS = Barangay, Municipality, Province
      parcelAddress1: row['PARCEL ADDRESS 1']?.trim() || undefined,
      parcelAddress2: row['PARCEL ADDRESS 2']?.trim() || undefined,
      parcelAddress3: row['PARCEL ADDRESS 3']?.trim() || undefined,
      parcelArea: row['PARCEL AREA'],
      cropArea: row['CROP AREA'],
      tribe: row['TRIBE']?.trim() !== 'null' ? row['TRIBE']?.trim() : undefined,
      agency: row['AGENCY']?.trim() || undefined,
      ownershipType: row['OWNERSHIP TYPE']?.trim() || undefined,
      ownerName: row['OWNER NAME']?.trim() || undefined,
      dateEncoded: parseExcelDate(row['DATE ENCODED']),
      commodities: [],
    });
  }

  // Add commodity if it doesn't already exist for this farmer
  const farmer = farmersByRsbsa.get(rsbsaCode);
  const commodityName = row['COMMODITY NAME']?.trim();
  const numberOfHeads = row['NUMBER OF HEADS'] || 0;

  if (commodityName) {
    const existingCommodity = farmer.commodities.find(
      (c) => c.commodityName === commodityName
    );

    if (!existingCommodity) {
      farmer.commodities.push({
        commodityName: commodityName,
        numberOfHeads: numberOfHeads,
      });
    }
  }
});

console.log(`Total unique farmers: ${farmersByRsbsa.size}`);

// Insert data into Supabase
async function seedDatabase() {
  try {
    const farmers = Array.from(farmersByRsbsa.values());

    // Prepare farmer records
    const farmerRecords = farmers.map((farmer) => ({
      rsbsa_code: farmer.rsbsaCode,
      last_name: farmer.lastName,
      first_name: farmer.firstName,
      middle_name: farmer.middleName || null,
      full_name: farmer.fullName,
      gender: farmer.gender || null,
      birthdate: farmer.birthdate ? farmer.birthdate.toISOString().split('T')[0] : null,
      is_farmer: farmer.isFarmer || false,
      is_farmworker: farmer.isFarmworker || false,
      is_fisherfolk: farmer.isFisherfolk || false,
      is_agriyouth: farmer.isAgriyouth || false,
      is_indigenous_people: farmer.isIndigenousPeople || false,
      is_organic_practitioner: farmer.isOrganicPractitioner || false,
      is_arb: farmer.isArb || false,
      farmer_address_1: farmer.farmerAddress1 || null,  // BARANGAY
      farmer_address_2: farmer.farmerAddress2 || null,  // MUNICIPALITY
      farmer_address_3: farmer.farmerAddress3 || null,  // PROVINCE
      parcel_no: farmer.parcelNo || null,
      parcel_address_1: farmer.parcelAddress1 || null,
      parcel_address_2: farmer.parcelAddress2 || null,
      parcel_address_3: farmer.parcelAddress3 || null,
      parcel_area: farmer.parcelArea || null,
      crop_area: farmer.cropArea || null,
      tribe: farmer.tribe || null,
      agency: farmer.agency || null,
      ownership_type: farmer.ownershipType || null,
      owner_name: farmer.ownerName || null,
      date_encoded: farmer.dateEncoded ? farmer.dateEncoded.toISOString() : null,
    }));

    // Insert farmers in batches
    const batchSize = 100;
    for (let i = 0; i < farmerRecords.length; i += batchSize) {
      const batch = farmerRecords.slice(i, i + batchSize);
      const { error } = await supabase
        .from('farmers')
        .upsert(batch, { onConflict: 'rsbsa_code' });

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(farmerRecords.length / batchSize)}`);
      }
    }

    // Prepare and insert commodities
    const commodityRecords = [];
    farmers.forEach((farmer) => {
      farmer.commodities.forEach((commodity) => {
        commodityRecords.push({
          rsbsa_code: farmer.rsbsaCode,
          commodity_name: commodity.commodityName,
          number_of_heads: commodity.numberOfHeads || 0,
        });
      });
    });

    console.log(`\n📦 Inserting ${commodityRecords.length} commodity records...`);
    for (let i = 0; i < commodityRecords.length; i += batchSize) {
      const batch = commodityRecords.slice(i, i + batchSize);
      const { error } = await supabase
        .from('farmer_commodities')
        .insert(batch);

      if (error) {
        console.error(`Error inserting commodities batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(
          `✅ Inserted commodities batch ${i / batchSize + 1}/${Math.ceil(
            commodityRecords.length / batchSize
          )}`
        );
      }
    }

    console.log('\n🎉 Done! Database seeded successfully.');
    console.log(`Total farmers: ${farmerRecords.length}`);
    console.log(`Total commodities: ${commodityRecords.length}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
