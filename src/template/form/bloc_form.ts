const formBlocTemplate = (blocName: string, fileName: string) => {
    return `
import 'dart:async';
import 'package:flutter_form_bloc/flutter_form_bloc.dart';
import 'package:xdragon/widgets/bloc_form/form_const.dart';
import 'package:xdragon/widgets/bloc_form/xdragon_form_base_cubit.dart';
import 'package:xdragon/widgets/bloc_form/xdragon_form_base_state.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends XdragonFormBlocBase<String, String> {
  ${blocName}Cubit() : super();

  @override
  FutureOr<void> onLoading() async {
    getFormData();
  }

  @override
  FutureOr<void> onSubmitting() async {
    // TODO: 表单提交逻辑
  }

  void getFormData() async {
    // TODO: 处理数据返回表单待展示内容List<XdragonFormFieldData> data
    // XdragonFormUtils().getFormDataForXdragonForm通过json数据生成表单控件数据
    List<XdragonFormFieldData> fieldDatas = [];

    List<GroupFormData> data = [];
    fieldDatas.forEach((element) {
      if (element.groupName != null) {
        final GroupFormData group = data.firstWhere((e) => e.groupName == element.groupName, orElse: () {
          return GroupFormData(groupName: element.groupName, groupData: []);
        });
        group.groupData?.add(element);
        if (!data.contains(group)) {
          data.add(group);
        }
      }
    });
    
    // TODO: 调用generateFieldBlocs(data);生成表单控件
    generateFieldBlocs(data);

    Map<int, bool> isValidByStep = {};
    fieldsBlocs.forEach((key, value) {
      isValidByStep[key] = MultiFieldBloc.areFieldBlocsValid(value.values);
    });

    // TODO: 
    emit(${blocName}State(
      formData: fieldDatas,
      fieldBlocs: fieldsBlocs,
      isValidByStep: isValidByStep,
    ));
  }
}
    `;
};

const formStateTemplate = (blocName:string, fileName: string) => {
    const stateName = blocName + 'State';
    return `
part of '${fileName}_cubit.dart';

class ${stateName} extends XdragonFormBlocBaseState<String, String> {
  ${stateName}({
    isValidByStep,
    bool isEditing = false,
    Map<int, Map<String, FieldBloc>> fieldBlocs = const {},
    int currentStep = 0,
    List formData = const [],
  }) : super(
        isValidByStep: isValidByStep ?? {},
        isEditing: isEditing,
        fieldBlocs: fieldBlocs,
        currentStep: currentStep,
        formData: formData,
      );

  @override
  ${stateName} copyWith(
    {bool? isLoading,
    String? formResError,
    bool? isPopPage,
    List? formData,
    Map<int, bool>? isValidByStep,
    Map<int, Map<String, FieldBloc<FieldBlocStateBase>>>? fieldBlocs}) {
    Map<int, Map<String, FieldBloc<FieldBlocStateBase>>> _tempFieldBlocs = {};
    for (int i = 0; i < (formData ?? this.formData).length; i++){
        _tempFieldBlocs[i] = this.fieldBlocs(i) ?? {};
    }
    return ${stateName}(
      isEditing: this.isEditing,
      currentStep: this.currentStep,
      formData: this.formData,
      isValidByStep: isValidByStep ?? this.isValidByStep,
      fieldBlocs: fieldBlocs ?? _tempFieldBlocs,
    );
  }

  // 提交表单会触发此方法，不能删除，否则页面state会变成框架默认的SubmitState类型跟业务冲突
  @override
  FormBlocState<String, String> toSubmitting({double? progress}) {
    return this;
  }

  @override
  List<Object?> get props => [formData, isValidByStep];
}
    `;
};


export {formBlocTemplate, formStateTemplate};
