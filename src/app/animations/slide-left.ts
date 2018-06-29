import { trigger, animate, style, group, query, transition } from '@angular/animations';

export const slideTransition = trigger('slideTransition', [
    transition('* <=> *', [
        query(':enter, :leave', style({ position: 'fixed' })
            , { optional: true }),
        group([
            query(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('0.5s ease-in', style({ transform: 'translateX(0%)',  opacity: 1  }))
            ], { optional: true }),
            query(':leave', [
                style({ opacity: 1 }),
                animate('0.25s ease-out', style({ opacity: 0 }))
            ], { optional: true })
        ])
    ])
]);
