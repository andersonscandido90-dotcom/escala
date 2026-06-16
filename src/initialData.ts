import { RosterService } from './types';

export const INITIAL_SERVICES: RosterService[] = [
  {
    "id": 1776383879322,
    "name": "Supervisor MO",
    "militares": [
      { "id": 12, "name": "MILITAR MO 01", "posto": "2°SG", "especialidade": "MO", "quarto": 1, "antiguidade": 1 },
      { "id": 13, "name": "MILITAR MO 02", "posto": "2°SG", "especialidade": "MO", "quarto": 1, "antiguidade": 2 },
      { "id": 14, "name": "MILITAR MO 03", "posto": "2°SG", "especialidade": "MO", "quarto": 1, "antiguidade": 3 },
      { "id": 15, "name": "MILITAR MO 04", "posto": "2°SG", "especialidade": "MO", "quarto": 1, "antiguidade": 4 },
      { "id": 16, "name": "MILITAR MO 05", "posto": "3°SG", "especialidade": "MO", "quarto": 1, "antiguidade": 5 },
      { "id": 17, "name": "MILITAR MO 06", "posto": "3°SG", "especialidade": "MO", "quarto": 2, "antiguidade": 6 },
      { "id": 18, "name": "MILITAR MO 07", "posto": "3°SG", "especialidade": "MO", "quarto": 2, "antiguidade": 7 },
      { "id": 19, "name": "MILITAR MO 08", "posto": "3°SG", "especialidade": "MO", "quarto": 2, "antiguidade": 8 },
      { "id": 20, "name": "MILITAR MO 09", "posto": "3°SG", "especialidade": "MO", "quarto": 2, "antiguidade": 9 },
      { "id": 21, "name": "MILITAR MO 10", "posto": "3°SG", "especialidade": "MO", "quarto": 2, "antiguidade": 10 },
      { "id": 22, "name": "MILITAR MO 11", "posto": "3°SG", "especialidade": "MO", "quarto": 3, "antiguidade": 11 },
      { "id": 23, "name": "MILITAR MO 12", "posto": "3°SG", "especialidade": "MO", "quarto": 3, "antiguidade": 12 },
      { "id": 24, "name": "MILITAR MO 13", "posto": "3°SG", "especialidade": "MO", "quarto": 3, "antiguidade": 13 },
      { "id": 25, "name": "MILITAR MO 14", "posto": "3°SG", "especialidade": "MO", "quarto": 3, "antiguidade": 14 },
      { "id": 26, "name": "MILITAR MO 15", "posto": "3°SG", "especialidade": "MO", "quarto": 3, "antiguidade": 15 },
      { "id": 27, "name": "MILITAR MO 16", "posto": "3°SG", "especialidade": "MO", "quarto": 4, "antiguidade": 16 },
      { "id": 28, "name": "MILITAR MO 17", "posto": "3°SG", "especialidade": "MO", "quarto": 4, "antiguidade": 17 },
      { "id": 29, "name": "MILITAR MO 18", "posto": "3°SG", "especialidade": "MO", "quarto": 4, "antiguidade": 18 },
      { "id": 30, "name": "MILITAR MO 19", "posto": "3°SG", "especialidade": "MO", "quarto": 4, "antiguidade": 19 }
    ],
    "statusPeriods": [
      { "id": 23, "militaryId": 16, "type": "FERIAS", "start": "2026-05-01", "end": "2026-05-30" },
      { "id": 24, "militaryId": 21, "type": "ACOMPANHANDO", "start": "2026-05-01", "end": "2026-05-30" },
      { "id": 25, "militaryId": 26, "type": "CURSO", "start": "2026-05-01", "end": "2026-05-30" },
      { "id": 27, "militaryId": 25, "type": "DESTACADO", "start": "2026-05-01", "end": "2026-05-30" },
      { "id": 28, "militaryId": 12, "type": "FERIAS", "start": "2026-05-04", "end": "2026-05-18" },
      { "id": 29, "militaryId": 12, "type": "FERIAS", "start": "2026-08-10", "end": "2026-08-24" },
      { "id": 30, "militaryId": 17, "type": "DISPENSA_MEDICA", "start": "2026-04-30", "end": "2026-05-01" },
      { "id": 31, "militaryId": 14, "type": "FOLGA", "start": "2026-05-13", "end": "2026-05-13" }
    ],
    "shipPeriods": [],
    "manualSwaps": [],
    "acompDuration": 4,
    "rosterModel": "QUARTOS",
    "holidayDates": [],
    "nextIds": { "military": 31, "status": 32, "ship": 1 },
    "config": {
      "startDate": "2026-04-20",
      "days": 30,
      "quartoOrder": "MODERNO_PRIMEIRO",
      "militaryOrder": "MAIS_MODERNO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": false
    }
  },
  {
    "id": 1776721274477,
    "name": "Supervisor Eletricista",
    "militares": [
      { "id": 1, "name": "SE 01", "posto": "2°SG", "especialidade": "EL", "quarto": 1, "antiguidade": 1 },
      { "id": 2, "name": "SE 02", "posto": "2°SG", "especialidade": "EL", "quarto": 1, "antiguidade": 2 },
      { "id": 3, "name": "SE 03", "posto": "2°SG", "especialidade": "CI", "quarto": 1, "antiguidade": 3 },
      { "id": 4, "name": "SE 04", "posto": "2°SG", "especialidade": "EL", "quarto": 1, "antiguidade": 4 },
      { "id": 5, "name": "SE 05", "posto": "3°SG", "especialidade": "EL", "quarto": 2, "antiguidade": 5 },
      { "id": 6, "name": "SE06", "posto": "3°SG", "especialidade": "EL", "quarto": 2, "antiguidade": 6 },
      { "id": 7, "name": "SE 07", "posto": "3°SG", "especialidade": "EL", "quarto": 2, "antiguidade": 7 },
      { "id": 8, "name": "SE 08", "posto": "3°SG", "especialidade": "EL", "quarto": 2, "antiguidade": 8 },
      { "id": 9, "name": "SE 09", "posto": "3°SG", "especialidade": "EL", "quarto": 3, "antiguidade": 9 },
      { "id": 10, "name": "SE 10", "posto": "3°SG", "especialidade": "EL", "quarto": 3, "antiguidade": 10 },
      { "id": 11, "name": "SE 11", "posto": "3°SG", "especialidade": "EL", "quarto": 3, "antiguidade": 11 },
      { "id": 12, "name": "SE 12", "posto": "3°SG", "especialidade": "EL", "quarto": 3, "antiguidade": 12 },
      { "id": 13, "name": "SE 13", "posto": "3°SG", "especialidade": "EL", "quarto": 4, "antiguidade": 13 },
      { "id": 14, "name": "SE 14", "posto": "3°SG", "especialidade": "EL", "quarto": 4, "antiguidade": 14 },
      { "id": 15, "name": "SE 15", "posto": "3°SG", "especialidade": "EL", "quarto": 4, "antiguidade": 15 },
      { "id": 16, "name": "SE 16", "posto": "3°SG", "especialidade": "EL", "quarto": 4, "antiguidade": 16 }
    ],
    "statusPeriods": [],
    "shipPeriods": [],
    "manualSwaps": [
      { "data": "2026-04-21", "originalMilitaryId": 15, "newMilitaryId": 14, "type": "substituir" },
      { "data": "2026-04-21", "originalMilitaryId": 14, "newMilitaryId": 15, "type": "substituir" },
      { "data": "2026-04-21", "originalMilitaryId": 15, "newMilitaryId": 16, "type": "troca" },
      { "data": "2026-04-21", "originalMilitaryId": 16, "newMilitaryId": 15, "type": "troca" },
      { "data": "2026-04-23", "originalMilitaryId": 13, "newMilitaryId": 14, "type": "troca" },
      { "data": "2026-04-23", "originalMilitaryId": 14, "newMilitaryId": 13, "type": "substituir" },
      { "data": "2026-04-24", "originalMilitaryId": 12, "newMilitaryId": 11, "type": "substituir" },
      { "data": "2026-04-24", "originalMilitaryId": 11, "newMilitaryId": 12, "type": "substituir" },
      { "data": "2026-04-24", "originalMilitaryId": 12, "newMilitaryId": 1, "type": "troca" },
      { "data": "2026-04-24", "originalMilitaryId": 1, "newMilitaryId": 12, "type": "substituir" },
      { "data": "2026-04-23", "originalMilitaryId": 13, "newMilitaryId": 12, "type": "troca" },
      { "data": "2026-04-24", "originalMilitaryId": 13, "newMilitaryId": 12, "type": "troca" },
      { "data": "2026-04-23", "originalMilitaryId": 12, "newMilitaryId": 13, "type": "troca" },
      { "data": "2026-04-23", "originalMilitaryId": 13, "newMilitaryId": 12, "type": "troca" },
      { "data": "2026-04-23", "originalMilitaryId": 12, "newMilitaryId": 13, "type": "troca" },
      { "data": "2026-04-23", "originalMilitaryId": 13, "newMilitaryId": 1, "type": "substituir" },
      { "data": "2026-04-23", "originalMilitaryId": 1, "newMilitaryId": 13, "type": "substituir" }
    ],
    "acompDuration": 3,
    "rosterModel": "QUARTOS_3",
    "holidayDates": [],
    "nextIds": { "military": 17, "status": 2, "ship": 1 },
    "config": {
      "startDate": "2026-06-20",
      "days": 30,
      "quartoOrder": "ANTIGO_PRIMEIRO",
      "militaryOrder": "MAIS_ANTIGO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": false
    }
  },
  {
    "id": 1776721342339,
    "name": "Fiel de Cav",
    "militares": [
      { "id": 1, "name": "FC 01", "posto": "2°SG", "especialidade": "MA", "quarto": 1, "antiguidade": 1 },
      { "id": 2, "name": "FC 02", "posto": "2°SG", "especialidade": "MA", "quarto": 1, "antiguidade": 2 },
      { "id": 3, "name": "FC 03", "posto": "2°SG", "especialidade": "MA", "quarto": 1, "antiguidade": 3 },
      { "id": 4, "name": "FC 04", "posto": "2°SG", "especialidade": "MC", "quarto": 1, "antiguidade": 4 },
      { "id": 5, "name": "FC 05", "posto": "3°SG", "especialidade": "MA", "quarto": 2, "antiguidade": 5 },
      { "id": 6, "name": "FC 06", "posto": "3°SG", "especialidade": "MC", "quarto": 2, "antiguidade": 6 },
      { "id": 7, "name": "FC 07", "posto": "3°SG", "especialidade": "MC", "quarto": 2, "antiguidade": 7 },
      { "id": 8, "name": "MC 08", "posto": "3°SG", "especialidade": "MC", "quarto": 2, "antiguidade": 8 },
      { "id": 9, "name": "FC 09", "posto": "3°SG", "especialidade": "MT", "quarto": 3, "antiguidade": 9 },
      { "id": 10, "name": "FC 10", "posto": "3°SG", "especialidade": "MT", "quarto": 3, "antiguidade": 10 },
      { "id": 11, "name": "FC 11", "posto": "3°SG", "especialidade": "MT", "quarto": 3, "antiguidade": 11 },
      { "id": 12, "name": "FC 12", "posto": "3°SG", "especialidade": "MT", "quarto": 3, "antiguidade": 12 },
      { "id": 13, "name": "FC 13", "posto": "3°SG", "especialidade": "MC", "quarto": 4, "antiguidade": 13 },
      { "id": 14, "name": "FC 14", "posto": "3°SG", "especialidade": "MC", "quarto": 4, "antiguidade": 14 },
      { "id": 15, "name": "FC 15", "posto": "3°SG", "especialidade": "MC", "quarto": 4, "antiguidade": 15 },
      { "id": 16, "name": "FC 16", "posto": "3°SG", "especialidade": "MC", "quarto": 4, "antiguidade": 16 }
    ],
    "statusPeriods": [],
    "shipPeriods": [],
    "manualSwaps": [],
    "acompDuration": 3,
    "rosterModel": "QUARTOS",
    "holidayDates": [],
    "nextIds": { "military": 17, "status": 2, "ship": 1 },
    "config": {
      "startDate": "2026-04-20",
      "days": 30,
      "quartoOrder": "ANTIGO_PRIMEIRO",
      "militaryOrder": "MAIS_MODERNO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": false
    }
  },
  {
    "id": 1776721379659,
    "name": "Fiel das Auxiliares",
    "militares": [
      { "id": 1, "name": "FIEL 01", "posto": "CB", "especialidade": "MO", "quarto": 1, "antiguidade": 1 },
      { "id": 2, "name": "FIEL 02", "posto": "CB", "especialidade": "MO", "quarto": 1, "antiguidade": 2 },
      { "id": 3, "name": "FIEL 03", "posto": "CB", "especialidade": "MO", "quarto": 1, "antiguidade": 3 },
      { "id": 4, "name": "FIEL 04", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 4 },
      { "id": 5, "name": "FIEL 05", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 5 },
      { "id": 6, "name": "FIEL 06", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 6 },
      { "id": 7, "name": "FIEL 07", "posto": "CB", "especialidade": "MO", "quarto": 3, "antiguidade": 7 },
      { "id": 8, "name": "FIEL 08", "posto": "CB", "especialidade": "MO", "quarto": 3, "antiguidade": 8 },
      { "id": 9, "name": "FIEL 09", "posto": "CB", "especialidade": "MO", "quarto": 3, "antiguidade": 9 },
      { "id": 10, "name": "FIEL 10", "posto": "CB", "especialidade": "MO", "quarto": 4, "antiguidade": 10 },
      { "id": 11, "name": "FIEL 11", "posto": "CB", "especialidade": "MO", "quarto": 4, "antiguidade": 11 },
      { "id": 12, "name": "FIEL 12", "posto": "CB", "especialidade": "MO", "quarto": 4, "antiguidade": 12 }
    ],
    "statusPeriods": [],
    "shipPeriods": [],
    "manualSwaps": [],
    "acompDuration": 3,
    "rosterModel": "CORRIDA_2",
    "holidayDates": [],
    "nextIds": { "military": 13, "status": 2, "ship": 1 },
    "config": {
      "startDate": "2026-04-20",
      "days": 30,
      "quartoOrder": "MODERNO_PRIMEIRO",
      "militaryOrder": "MAIS_ANTIGO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": false
    }
  },
  {
    "id": 1776721393181,
    "name": "Patrulha do Cav",
    "militares": [
      { "id": 1, "name": "P 01", "posto": "CB", "especialidade": "MO", "quarto": 1, "antiguidade": 1 },
      { "id": 2, "name": "P 02", "posto": "CB", "especialidade": "CI", "quarto": 1, "antiguidade": 2 },
      { "id": 3, "name": "P 03", "posto": "CB", "especialidade": "MO", "quarto": 1, "antiguidade": 3 },
      { "id": 4, "name": "P 04", "posto": "CB", "especialidade": "MO", "quarto": 1, "antiguidade": 4 },
      { "id": 5, "name": "P 05", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 5 },
      { "id": 6, "name": "P 06", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 6 },
      { "id": 7, "name": "P 07", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 7 },
      { "id": 8, "name": "P 08", "posto": "CB", "especialidade": "MO", "quarto": 2, "antiguidade": 8 },
      { "id": 9, "name": "P 09", "posto": "CB", "especialidade": "MO", "quarto": 3, "antiguidade": 9 },
      { "id": 10, "name": "P 10", "posto": "CB", "especialidade": "MO", "quarto": 3, "antiguidade": 10 },
      { "id": 11, "name": "P 11", "posto": "CB", "especialidade": "MP", "quarto": 3, "antiguidade": 11 },
      { "id": 12, "name": "P 12", "posto": "CB", "especialidade": "MP", "quarto": 3, "antiguidade": 12 },
      { "id": 13, "name": "P 13", "posto": "CB", "especialidade": "MP", "quarto": 4, "antiguidade": 13 },
      { "id": 14, "name": "P 14", "posto": "CB", "especialidade": "MP", "quarto": 4, "antiguidade": 14 },
      { "id": 15, "name": "P 15", "posto": "CB", "especialidade": "MP", "quarto": 4, "antiguidade": 15 },
      { "id": 16, "name": "P 16", "posto": "CB", "especialidade": "MP", "quarto": 4, "antiguidade": 16 }
    ],
    "statusPeriods": [],
    "shipPeriods": [],
    "manualSwaps": [],
    "acompDuration": 3,
    "rosterModel": "CORRIDA_3",
    "holidayDates": [],
    "nextIds": { "military": 17, "status": 6, "ship": 1 },
    "config": {
      "startDate": "2026-04-20",
      "days": 30,
      "quartoOrder": "MODERNO_PRIMEIRO",
      "militaryOrder": "MAIS_ANTIGO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": false
    }
  },
  {
    "id": 1776721425581,
    "name": "Supervisor de Máquinas",
    "militares": [
      { "id": 1, "name": "SM 01", "posto": "1°SG", "especialidade": "MM", "quarto": 1, "antiguidade": 1 },
      { "id": 2, "name": "SM 02", "posto": "1°SG", "especialidade": "MM", "quarto": 1, "antiguidade": 2 },
      { "id": 3, "name": "SM 03", "posto": "1°SG", "especialidade": "MM", "quarto": 2, "antiguidade": 3 },
      { "id": 4, "name": "SM 04", "posto": "1°SG", "especialidade": "MM", "quarto": 2, "antiguidade": 4 },
      { "id": 5, "name": "SM 05", "posto": "1°SG", "especialidade": "MM", "quarto": 3, "antiguidade": 5 },
      { "id": 7, "name": "SM 06", "posto": "1°SG", "especialidade": "MM", "quarto": 3, "antiguidade": 6 },
      { "id": 8, "name": "SM 07", "posto": "1°SG", "especialidade": "MM", "quarto": 4, "antiguidade": 7 },
      { "id": 9, "name": "SM 08", "posto": "1°SG", "especialidade": "MM", "quarto": 4, "antiguidade": 8 }
    ],
    "statusPeriods": [],
    "shipPeriods": [],
    "manualSwaps": [],
    "acompDuration": 3,
    "rosterModel": "CORRIDA",
    "holidayDates": [],
    "nextIds": { "military": 10, "status": 8, "ship": 1 },
    "config": {
      "startDate": "2026-04-20",
      "days": 30,
      "quartoOrder": "MODERNO_PRIMEIRO",
      "militaryOrder": "MAIS_MODERNO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": true
    }
  },
  {
    "id": 1776722784806,
    "name": "Eletricista de Serviço",
    "militares": [
      { "id": 1, "name": "EL 01", "posto": "CB", "especialidade": "EL", "quarto": 1, "antiguidade": 1 },
      { "id": 2, "name": "EL 02", "posto": "CB", "especialidade": "EL", "quarto": 1, "antiguidade": 2 },
      { "id": 3, "name": "EL 03", "posto": "CB", "especialidade": "EL", "quarto": 2, "antiguidade": 3 },
      { "id": 4, "name": "EL 04", "posto": "CB", "especialidade": "EL", "quarto": 3, "antiguidade": 4 },
      { "id": 5, "name": "EL 05", "posto": "CB", "especialidade": "EL", "quarto": 4, "antiguidade": 5 }
    ],
    "statusPeriods": [],
    "shipPeriods": [],
    "manualSwaps": [],
    "acompDuration": 3,
    "rosterModel": "CORRIDA",
    "holidayDates": [],
    "nextIds": { "military": 6, "status": 2, "ship": 1 },
    "config": {
      "startDate": "2026-04-20",
      "days": 30,
      "quartoOrder": "MODERNO_PRIMEIRO",
      "militaryOrder": "MAIS_ANTIGO",
      "militaryOrderVermelha": "MAIS_MODERNO",
      "skipVermelha": false
    }
  }
];

export const INITIAL_ACTIVE_SERVICE_ID = 1776721274477;

export const INITIAL_SIGNATURE_DATA = {
  "chefe": {
    "name": "BRUNO AFONSO PINTO",
    "rank": "Capitão de Fragata",
    "title": "Chefe do Departamento de Máquinas"
  },
  "detalhista": {
    "name": "ANDRE VINICIUS FERNANDES DA SILVA",
    "rank": "Terceiro-Sargento (MO)",
    "title": "Detalhista do Departamento de Máquinas"
  }
};

export const INITIAL_EXPORT_MAPPINGS = {
  "fielAux": 1776721379659,
  "supervisorMaq": 1776721425581,
  "supervisorMO": 1776383879322,
  "patrulhaCav": 1776721393181,
  "fielCav": 1776721342339,
  "supervisorEL": 1776721274477,
  "caboDia": 1776721379659,
  "eletrlux": 1776722784806
};
