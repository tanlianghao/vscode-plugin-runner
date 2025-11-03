const formBlocTemplate = (blocName: string, fileName: string) => {
    return `
import 'dart:async';
import 'package:flutter_form_bloc/flutter_form_bloc.dart';
import 'package:xdragon/utils/error_handler.dart';
import 'package:xdragon/widgets/bloc_form/bloc/hidden/hidden_form_cubit.dart';
import 'package:xdragon/widgets/bloc_form/form_const.dart';
import 'package:xdragon/widgets/bloc_form/xdragon_form_base_cubit.dart';
import 'package:xdragon/widgets/bloc_form/xdragon_form_base_state.dart';
import 'package:xdragon/widgets/bloc_form/xdragon_form_utils.dart';

part '${fileName}_state.dart';

class ${blocName}Cubit extends XdragonFormBlocBase<String, String> {
  ${blocName}Cubit() : super();

  ${blocName}State get currentState => state as ${blocName}State;

  List<String> _onChangeList = [];

  ///记录已经存在监听的表单项名称
  List<String> hasValueChangeListenerNameList = [];
  List<Map<String, dynamic>> elementList = [];

  @override
  FutureOr<void> onLoading() async {
    getFormData();
  }

  @override
  FutureOr<void> onSubmitting() async {
    // TODO: 表单提交逻辑
    try {
      Map<String, dynamic> reqParams = {};
      for (int i = 0; i < paramsData.length; i++) {
        final item = paramsData[i];
        // TODO: 根据自身需要加入请求参数
      }
    } catch (e, s) {
      handlerError(e, s);
    }
  }

  // TODO: 获取表单原数据，获取表单类型数据XdragonFormFieldData，生成fieldBloc
  void getFormData() async {
    try {
      emit(${blocName}State(pageStatus: ${blocName}Status.init));
      List<XdragonFormFieldData> fieldDatas = [];
      List<GroupFormData> data = [];

      fieldDatas =
          XdragonFormUtils().getFormDataForXdragonForm(${blocName.toLocaleLowerCase()}FormDataMap, handler: modifyFormFieldDataHandler);

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

      generateFieldBlocs(data);

      Map<String, FieldBloc> _tempBlocMap = {};

      fieldsBlocs.forEach((key, value) {
        _tempBlocMap.addAll(value);
      });
      onFieldChangeHandle(_tempBlocMap);

      Map<int, bool> isValidByStep = {};
      fieldsBlocs.forEach((key, value) {
        isValidByStep[key] = MultiFieldBloc.areFieldBlocsValid(value.values);
      });

      emit(currentState.copyWith(
          formData: fieldDatas,
          fieldBlocs: fieldsBlocs,
          isValidByStep: isValidByStep,
          pageStatus: ${blocName}Status.loaded));
    } catch (e, s) {
      handlerError(e, s);
      emit(currentState.copyWith(pageStatus: ${blocName}Status.fail));
    }
  }

  XdragonFormFieldData modifyFormFieldDataHandler(XdragonFormFieldData data) {
    // TODO: 根据自身业务需求处理表单项数据，比如给picker类型增加onTapHandler事件

    return data;
  }

  @override
  String? getPickerFormShowValue(String? name, String? value) {
    // TODO: picker类型表单项，如果选中的值是json字符串，需要重写此方法
    return value;
  }

  // TODO：存在联动的表单项需要增加此逻辑，否则可以删除该部分代码
  void onFieldChangeHandle(Map<String, FieldBloc> fieldsBlocs) {
    for (final key in fieldsBlocs.keys) {
      if (_onChangeList.contains(key)) {
        FieldBloc bloc = fieldsBlocs[key]!;
        int index = elementList.indexWhere((element) => element['name'] == key);
        String onChangeName = elementList[index]['onChange'];
        if (bloc is HiddenFormCubit && onChangeName.isNotEmpty) {
          hasValueChangeListenerNameList.remove(key);
        } else {
          if (bloc is SingleFieldBloc && onChangeName.isNotEmpty && !hasValueChangeListenerNameList.contains(key)) {
            hasValueChangeListenerNameList.add(key);
            bloc.onValueChanges(onData: (previous, now) async* {
              // TODO: 监听表单项值变化
            });
          }
        }
      }
    }
  }

  // TODO: 需要自定义表单项校验逻辑增加此逻辑，否则可以删除该部分代码
  @override
  List<Validator<String>> registerValidators(XdragonFormFieldData item) {
    List<Validator<String>> validators = [];

    final defaultValidators = super.registerValidators(item);

    validators.addAll(defaultValidators);

    return validators;
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
    this.pageStatus = ${blocName}Status.init,
  }) : super(
          isValidByStep: isValidByStep ?? {},
          isEditing: isEditing,
          fieldBlocs: fieldBlocs,
          currentStep: currentStep,
          formData: formData,
        );

  final ${blocName}Status pageStatus;
  @override
  ${stateName} copyWith(
      {bool? isLoading,
      String? formResError,
      bool? isPopPage,
      ${blocName}Status? pageStatus,
      List? formData,
      Map<int, bool>? isValidByStep,
      Map<int, Map<String, FieldBloc<FieldBlocStateBase>>>? fieldBlocs}) {
    Map<int, Map<String, FieldBloc>> newFieldBlocs = {};
    for (int i = 0; i < this.numberOfSteps; i++) {
      newFieldBlocs[i] = this.fieldBlocs(i) ?? {};
    }
    return ${stateName}(
      isEditing: this.isEditing,
      currentStep: this.currentStep,
      formData: formData ?? this.formData,
      isValidByStep: isValidByStep ?? this.isValidByStep,
      fieldBlocs: fieldBlocs ?? newFieldBlocs,
      pageStatus: pageStatus ?? this.pageStatus,
    );
  }

  // 提交表单会触发此方法，不能删除，否则页面state会变成框架默认的SubmitState类型跟业务冲突
  @override
  FormBlocState<String, String> toSubmitting({double? progress}) {
    return this;
  }

  @override
  List<Object?> get props => [formData, isValidByStep, pageStatus];
}

enum ${blocName}Status {
  init,
  loading,
  loaded,
  fail,
}

// 模拟数据，根据自身情况是否添加
final List<Map<String, dynamic>> ${blocName.toLocaleLowerCase()}FormDataMap = [
  {
    "disable": 0,
    "name": "followItem",
    "onChange": "followItem",
    "options": [{"label": "电话", "value": "电话"}, {"label": "微信", "value": "微信"}, {"label": "面访", "value": "面访"}],
    "label": "跟进类型",
    "type": "radio", // radio-单选 picker-支持点击回调 textarea-多行文本 text-单行文本 hidden-隐藏
    "value": "",
    "required": 1,
    "group": ""
  },
];
    `;
};

const formPageCodeTemplateBuilder = function(className: string, fileName: string) {
  return `
import 'package:flutter/material.dart';
import 'package:flutter_form_bloc/flutter_form_bloc.dart';
import '${fileName}';
import 'package:xdragon/widgets/app_bar.dart';
import 'package:xdragon/widgets/bloc_form/xdragon_form.dart';
import 'package:xltheme_ui/xltheme_ui.dart';

class ${className} extends StatefulWidget {
  const ${className}({Key? key}) : super(key: key);

  @override
  State<${className}> createState() => _${className}State();
}

class _${className}State extends State<${className}> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: XLAppBar(
          title: '通用示例页面',
        ),
        body: BlocProvider(
            create: (context) => ${className}Cubit(),
            child: Builder(builder: (ctx) {
              final formBloc = ctx.read<${className}Cubit>();
              return BlocBuilder<${className}Cubit, FormBlocState>(builder: (context, state) {
                if (state is ${className}State) {
                  if (state.pageStatus == ${className}Status.init ||
                      state.pageStatus == ${className}Status.loading) {
                    return Spinning();
                  } else if (state.pageStatus == ${className}Status.fail) {
                    return buildNetWorkError(() {});
                  } else {
                    return XdragonForm(formBloc: formBloc, state: state, fieldBlocs: formBloc.fieldsBlocs);
                  }
                }

                return const SizedBox.shrink();
              });
            })));
  }
}
  `;
};


export {formBlocTemplate, formStateTemplate, formPageCodeTemplateBuilder};
