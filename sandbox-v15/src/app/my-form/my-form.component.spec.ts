import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyFromComponent } from './my-form.component';

describe('MyFromComponent', () => {
  let component: MyFromComponent;
  let fixture: ComponentFixture<MyFromComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyFromComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyFromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
