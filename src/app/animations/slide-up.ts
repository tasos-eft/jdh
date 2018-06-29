import { trigger, animate, style, group, query, transition } from '@angular/animations';

export const slideUp = trigger('slideUp', [
    transition(':enter',
    [
        style({transform: 'translateY(100%)', opacity: 0}),
        animate('0.5s ease-in', style({transform: 'translateY(0)', 'opacity': 1}))
    ]),
    transition(':leave',
    [
        style({transform: 'translateY(0%)', opacity: 1}),
        animate('0.5s ease-out', style({transform: 'translateY(100%)', 'opacity': 0}))
    ])
]);
