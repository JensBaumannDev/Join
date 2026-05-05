import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindTask } from './find-task';

describe('FindTask', () => {
  let component: FindTask;
  let fixture: ComponentFixture<FindTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindTask],
    }).compileComponents();

    fixture = TestBed.createComponent(FindTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
