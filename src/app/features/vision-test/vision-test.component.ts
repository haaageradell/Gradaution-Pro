import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/** Number of angular segments (Landolt C gap directions). */
const SEGMENT_COUNT = 8;

/** Total trials: 4 per eye (after covering the opposite eye). */
const TRIALS_FIRST_EYE = 4;
const TRIALS_TOTAL = 8;

export type VisionPhase =
  | 'prepLeft'
  | 'instruct1'
  | 'testing'
  | 'prepRight'
  | 'instruct2'
  | 'results';

@Component({
  selector: 'app-vision-test',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vision-test.component.html',
  styleUrl: './vision-test.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisionTestComponent {
  protected readonly trialsTotal = TRIALS_TOTAL;
  protected readonly trialsFirstEye = TRIALS_FIRST_EYE;
  protected readonly segmentCount = SEGMENT_COUNT;
  protected readonly segmentIndices: readonly number[] = Array.from(
    { length: SEGMENT_COUNT },
    (_, i) => i,
  );

  protected readonly phase = signal<VisionPhase>('prepLeft');
  protected readonly answeredCount = signal(0);
  protected readonly correctCount = signal(0);
  protected readonly correctGapIndex = signal(0);
  protected readonly inputLocked = signal(false);

  /** Smaller on-screen reference = finer gap task (viewBox unchanged). */
  protected readonly rOuterRef = 38;
  protected readonly rInnerRef = 24;
  protected readonly rOuterPick = 90;
  protected readonly rInnerPick = 52;

  /** Number of incorrect trials so far (equals final wrong count when all trials are done). */
  protected readonly wrongAnswers = computed(
    () => this.answeredCount() - this.correctCount(),
  );

  protected readonly progressDots = computed(() => {
    const n = this.answeredCount();
    return Array.from({ length: TRIALS_TOTAL }, (_, i) => i < n);
  });

  protected readonly currentTrialNumber = computed(() =>
    Math.min(this.answeredCount() + 1, TRIALS_TOTAL),
  );

  protected wedgePath(index: number, rInner: number, rOuter: number): string {
    const slice = (2 * Math.PI) / SEGMENT_COUNT;
    const a0 = -Math.PI / 2 + index * slice;
    const a1 = a0 + slice;
    const xo0 = this.rx(a0, rOuter);
    const yo0 = this.ry(a0, rOuter);
    const xo1 = this.rx(a1, rOuter);
    const yo1 = this.ry(a1, rOuter);
    const xi1 = this.rx(a1, rInner);
    const yi1 = this.ry(a1, rInner);
    const xi0 = this.rx(a0, rInner);
    const yi0 = this.ry(a0, rInner);
    return [
      `M ${xo0} ${yo0}`,
      `A ${rOuter} ${rOuter} 0 0 1 ${xo1} ${yo1}`,
      `L ${xi1} ${yi1}`,
      `A ${rInner} ${rInner} 0 0 0 ${xi0} ${yi0}`,
      'Z',
    ].join(' ');
  }

  protected labelForSegment(index: number): string {
    const labels = [
      'top',
      'top-right',
      'right',
      'bottom-right',
      'bottom',
      'bottom-left',
      'left',
      'top-left',
    ];
    return labels[index] ?? `segment ${index}`;
  }

  /** Results headline — driven by wrong answers; perfect run gets a clear win message. */
  protected readonly resultHeadline = computed(() => {
    const w = this.wrongAnswers();
    if (w === 0) {
      return `Perfect — all ${TRIALS_TOTAL} matches correct`;
    }
    if (w <= 2) {
      return 'A few mismatches — worth a professional check';
    }
    if (w <= 5) {
      return 'Several mismatches — vision may be weaker on this task';
    }
    return 'Many mismatches — please prioritise an eye exam';
  });

  /** Plain-language summary: wrong count only (no %). */
  protected readonly resultMistakeSummary = computed(() => {
    const w = this.wrongAnswers();
    const t = TRIALS_TOTAL;
    if (w === 0) {
      return `You got all ${t} questions correct — zero mistakes.`;
    }
    if (w === 1) {
      return `You answered 1 question incorrectly out of ${t}.`;
    }
    return `You answered ${w} questions incorrectly out of ${t}.`;
  });

  protected readonly resultBody = computed(() => {
    const w = this.wrongAnswers();
    if (w === 0) {
      return (
        `You matched every gap on all ${TRIALS_TOTAL} trials — that is an excellent result for this short exercise. ` +
        'It shows your eyes handled this on-screen task very well. Other vision or eye-health issues can still exist outside what this game measures, ' +
        'so routine check-ups on your usual schedule remain a good habit.'
      );
    }
    if (w <= 2) {
      return (
        'Missing a small number of directions here can still happen with eye strain, screen distance, or uncorrected vision. ' +
        'If anything looks blurry in daily life, treat that as more important than this informal exercise.'
      );
    }
    if (w <= 5) {
      return (
        'Several wrong answers on a fine-detail task often mean your eyes are working harder than they should — ' +
        'or that you may need an updated prescription. This pattern is a reason to speak with an eye specialist, not a diagnosis by itself.'
      );
    }
    return (
      'Many incorrect answers strongly suggest your vision is not performing reliably for this type of detail. ' +
      'Please book a comprehensive eye test as soon as you can so a clinician can check acuity, refraction, and eye health properly.'
    );
  });

  protected readonly resultDoctorLine = computed(() => {
    const w = this.wrongAnswers();
    if (w === 0) {
      return (
        'Nothing in this quick test points to a problem with matching these gap directions. ' +
        'If you see clearly in real life and feel fine, you do not need an extra doctor visit because of this screen alone — ' +
        'just keep your normal eye-care routine and go sooner if symptoms ever appear.'
      );
    }
    return (
      'You need an in-person visit with an optometrist or ophthalmologist to know if your vision is truly weak and what to do next. ' +
      'This app cannot diagnose you — only a clinician can, after proper testing.'
    );
  });

  protected goPrepLeftNext(): void {
    this.phase.set('instruct1');
  }

  protected goInstruct1Ready(): void {
    this.phase.set('testing');
    this.rollNewGap();
  }

  protected goPrepRightNext(): void {
    this.phase.set('instruct2');
  }

  protected goInstruct2Ready(): void {
    this.phase.set('testing');
    this.rollNewGap();
  }

  protected restart(): void {
    this.phase.set('prepLeft');
    this.answeredCount.set(0);
    this.correctCount.set(0);
    this.correctGapIndex.set(0);
    this.inputLocked.set(false);
  }

  protected onSegmentPick(picked: number): void {
    if (this.phase() !== 'testing' || this.inputLocked()) {
      return;
    }
    this.inputLocked.set(true);
    if (picked === this.correctGapIndex()) {
      this.correctCount.update((c) => c + 1);
    }
    this.answeredCount.update((a) => a + 1);

    window.setTimeout(() => {
      const done = this.answeredCount();
      if (done === TRIALS_FIRST_EYE) {
        this.phase.set('prepRight');
        this.inputLocked.set(false);
        return;
      }
      if (done === TRIALS_TOTAL) {
        this.phase.set('results');
        this.inputLocked.set(false);
        return;
      }
      this.rollNewGap();
      this.inputLocked.set(false);
    }, 380);
  }

  private rollNewGap(): void {
    const prev = this.correctGapIndex();
    let next = this.randomSegment();
    let guard = 0;
    while (next === prev && guard < 12) {
      next = this.randomSegment();
      guard += 1;
    }
    this.correctGapIndex.set(next);
  }

  private randomSegment(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % SEGMENT_COUNT;
    }
    return Math.floor(Math.random() * SEGMENT_COUNT);
  }

  private rx(angle: number, r: number): string {
    return (Math.cos(angle) * r).toFixed(2);
  }

  private ry(angle: number, r: number): string {
    return (Math.sin(angle) * r).toFixed(2);
  }
}
