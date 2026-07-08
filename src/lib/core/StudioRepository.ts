import { StudioState, Studio } from "@/store/types";
import { StudioCRUD } from "./services/StudioCRUD";
import { StudioSync } from "./services/StudioSync";
import { WajibTemplate, TambahanTemplate } from "./templates";

export class StudioRepository {
  private crud: StudioCRUD;
  private sync: StudioSync;

  constructor(
    private set: (partial: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>)) => void,
    private get: () => StudioState
  ) {
    this.sync = new StudioSync(set, get);
    this.crud = new StudioCRUD(set, get, this.sync.loadStudio.bind(this.sync));
  }

  public async fetchStudios() {
    return this.crud.fetchStudios();
  }

  public async createStudio(name: string, wajib: WajibTemplate = "basic", tambahan: TambahanTemplate = "none") {
    return this.crud.createStudio(name, wajib, tambahan);
  }

  public async updateStudio(updates: Partial<Studio>, id?: string) {
    return this.crud.updateStudio(updates, id);
  }

  public async deleteStudio(studioId: string) {
    return this.crud.deleteStudio(studioId);
  }

  public async loadStudio(studioId: string) {
    return this.sync.loadStudio(studioId);
  }

  public async saveStudio() {
    return this.sync.saveStudio();
  }

  public async pollStatus() {
    return this.sync.pollStatus();
  }
}
