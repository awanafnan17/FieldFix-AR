/**
 * FieldFixAudioController.ts
 * Spatial audio feedback controller for FieldFix AR using procedural WAV assets
 * generated in Assets/GeneratedSFX/ via CLAD /build-sfx.
 */

const DEFAULT_CLICK_SFX = requireAsset("../GeneratedSFX/ButtonClick.wav") as AudioTrackAsset
const DEFAULT_SCAN_SFX = requireAsset("../GeneratedSFX/ScanSweep.wav") as AudioTrackAsset
const DEFAULT_ALERT_SFX = requireAsset("../GeneratedSFX/FaultAlert.wav") as AudioTrackAsset
const DEFAULT_CONFIRM_SFX = requireAsset("../GeneratedSFX/RepairStepConfirm.wav") as AudioTrackAsset
const DEFAULT_COMPLETE_SFX = requireAsset("../GeneratedSFX/DiagnosticComplete.wav") as AudioTrackAsset

@component
export class FieldFixAudioController extends BaseScriptComponent {
  @input
  @hint("Master volume for FieldFix AR spatial audio cues (0.0 - 1.0)")
  public masterVolume: number = 0.85

  private clickPlayer: AudioComponent | null = null
  private scanPlayer: AudioComponent | null = null
  private alertPlayer: AudioComponent | null = null
  private confirmPlayer: AudioComponent | null = null
  private completePlayer: AudioComponent | null = null

  public onAwake(): void {
    this.clickPlayer = this.createPlayer("ClickSFX", DEFAULT_CLICK_SFX, 0.7)
    this.scanPlayer = this.createPlayer("ScanSFX", DEFAULT_SCAN_SFX, 0.85)
    this.alertPlayer = this.createPlayer("AlertSFX", DEFAULT_ALERT_SFX, 0.8)
    this.confirmPlayer = this.createPlayer("ConfirmSFX", DEFAULT_CONFIRM_SFX, 0.85)
    this.completePlayer = this.createPlayer("CompleteSFX", DEFAULT_COMPLETE_SFX, 0.9)
  }

  private createPlayer(name: string, track: AudioTrackAsset | null, baseVolume: number): AudioComponent | null {
    if (!track) return null
    const obj = global.scene.createSceneObject(name)
    obj.setParent(this.sceneObject)
    const audio = obj.createComponent("Component.AudioComponent") as AudioComponent
    audio.audioTrack = track
    audio.volume = Math.max(0, Math.min(1, baseVolume * this.masterVolume))
    return audio
  }

  private safePlay(player: AudioComponent | null): void {
    if (!player || !player.audioTrack) return
    try {
      player.play(1)
    } catch (e) {
      // Ignore audio device contention in headless preview runs
    }
  }

  public playClick(): void {
    this.safePlay(this.clickPlayer)
  }

  public playScan(): void {
    this.safePlay(this.scanPlayer)
  }

  public playAlert(): void {
    this.safePlay(this.alertPlayer)
  }

  public playStepConfirm(): void {
    this.safePlay(this.confirmPlayer)
  }

  public playComplete(): void {
    this.safePlay(this.completePlayer)
  }
}
