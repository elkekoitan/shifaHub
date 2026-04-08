import { BaseAgent, type AgentEvent } from "./base-agent.js";

interface NERResult {
  diseases: string[];
  herbs: string[];
  bodyParts: string[];
  treatments: string[];
}

export class ClinicalAgent extends BaseAgent {
  readonly name = "ClinicalAgent";
  readonly description = "Tedavi protokolleri, anamnez, NER pipeline, kan degerleri";

  async handle(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case "TREATMENT_CREATED":
        await this.handleTreatmentCreated(event);
        break;
      case "LAB_RESULT_ADDED":
        await this.handleLabResult(event);
        break;
      case "NER_EXTRACT_REQUESTED":
        await this.handleNERExtract(event);
        break;
      case "CONTRAINDICATION_CHECK":
        await this.handleContraindicationCheck(event);
        break;
      default:
        this.log.warn({ event: event.type }, "Unknown event");
    }
  }

  // NER Pipeline - Turkce metin analizi
  async extractEntities(text: string): Promise<NERResult> {
    // TODO: Claude API entegrasyonu ile gercek NER
    // Simdilik basit keyword matching
    const result: NERResult = {
      diseases: [],
      herbs: [],
      bodyParts: [],
      treatments: [],
    };

    const diseaseKeywords = ["diyabet", "hipertansiyon", "astim", "romatizma", "migren", "anemi"];
    const herbKeywords = ["cantaron", "kekik", "zencefil", "zerdeçal", "corek otu", "papatya"];
    const bodyKeywords = ["bas", "sirt", "bel", "boyun", "omuz", "diz", "ayak", "el"];
    const treatmentKeywords = ["hacamat", "solucan", "akupunktur", "sujok", "refleksoloji", "fitoterapi"];

    const lowerText = text.toLowerCase();

    for (const keyword of diseaseKeywords) {
      if (lowerText.includes(keyword)) result.diseases.push(keyword);
    }
    for (const keyword of herbKeywords) {
      if (lowerText.includes(keyword)) result.herbs.push(keyword);
    }
    for (const keyword of bodyKeywords) {
      if (lowerText.includes(keyword)) result.bodyParts.push(keyword);
    }
    for (const keyword of treatmentKeywords) {
      if (lowerText.includes(keyword)) result.treatments.push(keyword);
    }

    return result;
  }

  // Kontraendikasyon kontrolu
  checkContraindications(treatmentType: string, conditions: string[]): string[] {
    const warnings: string[] = [];

    const contraindicationMap: Record<string, string[]> = {
      hacamat_yas: ["hamilelik", "kanama_bozuklugu", "anemi", "kan_sulandirici"],
      solucan: ["hamilelik", "kanama_bozuklugu", "hemofili"],
      akupunktur: ["hamilelik_ilk_trimester", "kanama_bozuklugu"],
    };

    const rules = contraindicationMap[treatmentType] || [];
    for (const condition of conditions) {
      if (rules.includes(condition.toLowerCase())) {
        warnings.push(`UYARI: ${treatmentType} icin kontraendikasyon - ${condition}`);
      }
    }

    return warnings;
  }

  private async handleTreatmentCreated(event: AgentEvent) {
    this.logAction("Tedavi kaydi olusturuldu", event.payload);

    // NER calistir
    const complaints = event.payload.complaints as string;
    if (complaints) {
      const entities = await this.extractEntities(complaints);
      if (entities.diseases.length > 0 || entities.herbs.length > 0) {
        this.emit("NER_EXTRACTED", { tedaviId: event.payload.id, entities });
      }
    }
  }

  private async handleLabResult(event: AgentEvent) {
    this.logAction("Tahlil sonucu eklendi", event.payload);

    // Referans disi deger kontrolu
    const values = event.payload.values as Array<{ name: string; value: number; referenceMax?: number; referenceMin?: number }>;
    if (values) {
      const outOfRange = values.filter(
        (v) => (v.referenceMax && v.value > v.referenceMax) || (v.referenceMin && v.value < v.referenceMin),
      );
      if (outOfRange.length > 0) {
        this.emit("LAB_RESULT_ALERT", {
          danisanId: event.payload.danisanId,
          alerts: outOfRange.map((v) => `${v.name}: ${v.value} (referans disi)`),
        });
      }
    }
  }

  private async handleNERExtract(event: AgentEvent) {
    const text = event.payload.text as string;
    const entities = await this.extractEntities(text);
    this.emit("NER_EXTRACTED", { entities, sourceText: text });
  }

  private async handleContraindicationCheck(event: AgentEvent) {
    const { treatmentType, conditions } = event.payload as { treatmentType: string; conditions: string[] };
    const warnings = this.checkContraindications(treatmentType, conditions);
    if (warnings.length > 0) {
      this.emit("CONTRAINDICATION_ALERT", { warnings, treatmentType });
    }
  }
}

export const clinicalAgent = new ClinicalAgent();
